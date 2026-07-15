package com.citibank.customerapi.service;

import com.citibank.customerapi.dto.CreateAccountRequest;
import com.citibank.customerapi.model.Accounts;
import com.citibank.customerapi.repository.AccountRepository;
import com.citibank.customerapi.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/*
 * Holds the business rules for accounts (ownership checks, balance rules,
 * transfers between accounts) so the controller only deals with HTTP concerns.
 */
@Service
public class AccountService {

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

    public Accounts createAccount(CreateAccountRequest request) {
        if (accountRepository.existsById(request.getAccountNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Account " + request.getAccountNumber() + " already exists");
        }
        if (!customerRepository.existsById(request.getPrimaryOwner())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer " + request.getPrimaryOwner() + " not found");
        }

        Accounts account = new Accounts(
                request.getAccountType(),
                request.getAccountNumber(),
                request.getPrimaryOwner(),
                null,
                request.getRoutingNumber(),
                request.getBalance(),
                request.isDirectDeposit(),
                request.getApy());

        return accountRepository.save(account);
    }

    public void deleteAccount(String accountNumber) {
        if (!accountRepository.existsById(accountNumber)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account " + accountNumber + " not found");
        }
        accountRepository.deleteById(accountNumber);
    }

    public Accounts deposit(String accountNumber, double amount) {
        requirePositiveAmount(amount);
        Accounts account = getAccount(accountNumber);
        account.deposit(amount);
        return accountRepository.save(account);
    }

    public Accounts withdraw(String accountNumber, double amount) {
        requirePositiveAmount(amount);
        Accounts account = getAccount(accountNumber);
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
        account.addJointOwner(jointOwnerCustomerId);
        return accountRepository.save(account);
    }

    private void requirePositiveAmount(double amount) {
        if (amount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }
    }
}
