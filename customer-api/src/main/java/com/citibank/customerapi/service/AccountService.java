package com.citibank.customerapi.service;

import com.citibank.customerapi.dto.CreateAccountRequest;
import com.citibank.customerapi.model.Accounts;
import com.citibank.customerapi.model.Customer;
import com.citibank.customerapi.repository.AccountRepository;
import com.citibank.customerapi.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;

/*
 * Holds the business rules for accounts (ownership checks, balance rules,
 * transfers between accounts) so the controller only deals with HTTP concerns.
 */
@Service
public class AccountService {

    // Every account shares one routing number, since a routing number identifies
    // the bank/branch rather than the individual account (matches the seed data).
    private static final String ROUTING_NUMBER = "021000021";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;

    public AccountService(AccountRepository accountRepository, CustomerRepository customerRepository) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
    }

    public List<Accounts> getAllAccounts() {
        return accountRepository.findAll();
    }

    public List<Accounts> getAccountsForCustomer(String customerId) {
        return accountRepository.findByPrimaryOwnerOrJointOwnersContaining(customerId, customerId);
    }

    public Accounts getAccount(String accountNumber) {
        return accountRepository.findById(accountNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account " + accountNumber + " not found"));
    }

    // Account numbers are never chosen by the caller - always generated here so
    // nobody can pick their own (or someone else's) account number, and every
    // account shares the same server-assigned routing number.
    public Accounts createAccount(CreateAccountRequest request) {
        if (!customerRepository.existsById(request.getPrimaryOwner())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer " + request.getPrimaryOwner() + " not found");
        }

        // Term/maturity only ever apply to Certificates - any value sent for another
        // account type is ignored so the maturity lock can never apply elsewhere.
        Integer termMonths = null;
        LocalDate maturityDate = null;
        if ("Certificate".equals(request.getAccountType())) {
            termMonths = request.getTermMonths();
            if (termMonths == null || termMonths <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Term length (months) is required for a Certificate account");
            }
            maturityDate = LocalDate.now().plusMonths(termMonths);
        }

        Accounts account = new Accounts(
                request.getAccountType(),
                generateAccountNumber(),
                request.getPrimaryOwner(),
                null,
                ROUTING_NUMBER,
                request.getBalance(),
                request.isDirectDeposit(),
                request.getApy(),
                termMonths,
                maturityDate);

        String nickname = request.getNickname();
        account.setNickname(nickname != null && !nickname.isBlank() ? nickname : request.getAccountType());

        return accountRepository.save(account);
    }

    private String generateAccountNumber() {
        String candidate;
        do {
            candidate = String.format("%010d", (long) (RANDOM.nextDouble() * 10_000_000_000L));
        } while (accountRepository.existsById(candidate));
        return candidate;
    }

    public Accounts renameAccount(String accountNumber, String nickname) {
        if (nickname == null || nickname.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nickname is required");
        }
        Accounts account = getAccount(accountNumber);
        requireNotClosed(account);
        account.setNickname(nickname);
        return accountRepository.save(account);
    }

    // Soft-close: the account is marked CLOSED (and kept, with its transaction
    // history, for audit) rather than removed from the database.
    public void deleteAccount(String accountNumber) {
        Accounts account = getAccount(accountNumber);
        requireNotClosed(account);
        if (account.getBalance() != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account balance must be zero before closing");
        }
        account.close();
        accountRepository.save(account);
    }

    public Accounts setFrozen(String accountNumber, boolean frozen) {
        Accounts account = getAccount(accountNumber);
        requireNotClosed(account);
        if (frozen) {
            account.freeze();
        } else {
            account.unfreeze();
        }
        return accountRepository.save(account);
    }

    public Accounts deposit(String accountNumber, double amount) {
        requirePositiveAmount(amount);
        Accounts account = getAccount(accountNumber);
        requireTransactable(account);
        account.deposit(amount);
        return accountRepository.save(account);
    }

    public Accounts withdraw(String accountNumber, double amount) {
        requirePositiveAmount(amount);
        Accounts account = getAccount(accountNumber);
        requireTransactable(account);
        requireMatured(account);
        if (amount > account.getBalance()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient funds");
        }
        account.withdraw(amount);
        return accountRepository.save(account);
    }

    public Accounts transfer(String fromAccountNumber, String toAccountNumber, double amount) {
        requirePositiveAmount(amount);
        if (fromAccountNumber.equals(toAccountNumber)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot transfer to the same account");
        }

        Accounts fromAccount = getAccount(fromAccountNumber);
        Accounts toAccount = getAccount(toAccountNumber);
        requireTransactable(fromAccount);
        requireTransactable(toAccount);
        // Only the source account's maturity lock applies - receiving a transfer
        // into a Certificate isn't restricted.
        requireMatured(fromAccount);

        if (!fromAccount.transferTo(toAccount, amount)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transfer failed: insufficient funds or invalid amount");
        }

        accountRepository.save(toAccount);
        return accountRepository.save(fromAccount);
    }

    public Accounts addJointOwner(String accountNumber, String jointOwnerCustomerId) {
        if (!customerRepository.existsById(jointOwnerCustomerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer " + jointOwnerCustomerId + " not found");
        }
        Accounts account = getAccount(accountNumber);
        requireTransactable(account);
        account.addJointOwner(jointOwnerCustomerId);
        return accountRepository.save(account);
    }

    private void requirePositiveAmount(double amount) {
        if (amount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }
    }

    // Deposit/withdraw/transfer/joint-owner changes are blocked on both closed
    // and frozen accounts, and on accounts owned by a frozen customer; renaming
    // only checks requireNotClosed directly.
    private void requireTransactable(Accounts account) {
        requireNotClosed(account);
        requireNotFrozen(account);
        requireOwnersNotFrozen(account);
    }

    private void requireNotClosed(Accounts account) {
        if (account.isClosed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account " + account.getAccountNumber() + " is closed");
        }
    }

    private void requireNotFrozen(Accounts account) {
        if (account.isFrozen()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account " + account.getAccountNumber() + " is frozen");
        }
    }

    private void requireMatured(Accounts account) {
        if (account.isCertificate() && !account.isMatured()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Certificate " + account.getAccountNumber() + " is locked until it matures on " + account.getMaturityDate());
        }
    }

    // A frozen customer's login is blocked going forward (see CustomerService.authenticate),
    // but an already-issued JWT is never revoked - so transactions are also blocked here,
    // per-request, for any account where the primary owner or a joint owner is frozen.
    private void requireOwnersNotFrozen(Accounts account) {
        requireCustomerNotFrozen(account.getPrimaryOwner());
        for (String jointOwner : account.getJointOwners()) {
            requireCustomerNotFrozen(jointOwner);
        }
    }

    private void requireCustomerNotFrozen(String customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer " + customerId + " not found"));
        if (customer.isFrozen()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer " + customerId + " is frozen");
        }
    }
}
