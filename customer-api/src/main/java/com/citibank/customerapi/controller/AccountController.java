package com.citibank.customerapi.controller;

import com.citibank.customerapi.dto.AccountResponse;
import com.citibank.customerapi.dto.AmountRequest;
import com.citibank.customerapi.dto.CreateAccountRequest;
import com.citibank.customerapi.dto.RenameAccountRequest;
import com.citibank.customerapi.dto.TransferRequest;
import com.citibank.customerapi.service.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // GET /api/accounts -> every account (admin view)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<AccountResponse> getAllAccounts() {
        return accountService.getAllAccounts().stream().map(AccountResponse::new).toList();
    }

    // GET /api/accounts/{accountNumber} -> a single account, or 404
    @PreAuthorize("hasRole('ADMIN') or @accountAccess.isOwner(#accountNumber, authentication)")
    @GetMapping("/{accountNumber}")
    public AccountResponse getAccount(@PathVariable String accountNumber) {
        return new AccountResponse(accountService.getAccount(accountNumber));
    }

    // POST /api/accounts -> opens a new account, 409 if the account number is taken.
    // Self-service callers may only open accounts for themselves; admins may open for anyone.
    @PreAuthorize("hasRole('ADMIN') or #request.primaryOwner == authentication.name")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse createAccount(@RequestBody CreateAccountRequest request) {
        return new AccountResponse(accountService.createAccount(request));
    }

    // PUT /api/accounts/{accountNumber}/nickname -> renames an account, or 404
    @PreAuthorize("hasRole('ADMIN') or @accountAccess.isOwner(#accountNumber, authentication)")
    @PutMapping("/{accountNumber}/nickname")
    public AccountResponse renameAccount(@PathVariable String accountNumber, @RequestBody RenameAccountRequest request) {
        return new AccountResponse(accountService.renameAccount(accountNumber, request.getNickname()));
    }

    // DELETE /api/accounts/{accountNumber} -> soft-closes an account (balance must be zero), or 404
    @PreAuthorize("hasRole('ADMIN') or @accountAccess.isPrimaryOwner(#accountNumber, authentication)")
    @DeleteMapping("/{accountNumber}")
    public void deleteAccount(@PathVariable String accountNumber) {
        accountService.deleteAccount(accountNumber);
    }

    // PUT /api/accounts/{accountNumber}/freeze -> freezes the account (blocks deposit/withdraw/transfer/joint-owner changes)
    @PreAuthorize("hasRole('ADMIN') or @accountAccess.isPrimaryOwner(#accountNumber, authentication)")
    @PutMapping("/{accountNumber}/freeze")
    public AccountResponse freezeAccount(@PathVariable String accountNumber) {
        return new AccountResponse(accountService.setFrozen(accountNumber, true));
    }

    // PUT /api/accounts/{accountNumber}/unfreeze -> unfreezes the account
    @PreAuthorize("hasRole('ADMIN') or @accountAccess.isPrimaryOwner(#accountNumber, authentication)")
    @PutMapping("/{accountNumber}/unfreeze")
    public AccountResponse unfreezeAccount(@PathVariable String accountNumber) {
        return new AccountResponse(accountService.setFrozen(accountNumber, false));
    }

    // POST /api/accounts/{accountNumber}/deposit
    @PreAuthorize("hasRole('ADMIN') or @accountAccess.isOwner(#accountNumber, authentication)")
    @PostMapping("/{accountNumber}/deposit")
    public AccountResponse deposit(@PathVariable String accountNumber, @RequestBody AmountRequest request) {
        return new AccountResponse(accountService.deposit(accountNumber, request.getAmount()));
    }

    // POST /api/accounts/{accountNumber}/withdraw
    @PreAuthorize("hasRole('ADMIN') or @accountAccess.isOwner(#accountNumber, authentication)")
    @PostMapping("/{accountNumber}/withdraw")
    public AccountResponse withdraw(@PathVariable String accountNumber, @RequestBody AmountRequest request) {
        return new AccountResponse(accountService.withdraw(accountNumber, request.getAmount()));
    }

    // POST /api/accounts/{accountNumber}/transfer -> ownership is checked against the FROM
    // account (the path variable); the destination account is not ownership-checked.
    @PreAuthorize("hasRole('ADMIN') or @accountAccess.isOwner(#accountNumber, authentication)")
    @PostMapping("/{accountNumber}/transfer")
    public AccountResponse transfer(@PathVariable String accountNumber, @RequestBody TransferRequest request) {
        return new AccountResponse(accountService.transfer(accountNumber, request.getToAccountNumber(), request.getAmount()));
    }

    // POST /api/accounts/{accountNumber}/joint-owners/{customerId}
    @PreAuthorize("hasRole('ADMIN') or @accountAccess.isPrimaryOwner(#accountNumber, authentication)")
    @PostMapping("/{accountNumber}/joint-owners/{customerId}")
    public AccountResponse addJointOwner(@PathVariable String accountNumber, @PathVariable String customerId) {
        return new AccountResponse(accountService.addJointOwner(accountNumber, customerId));
    }
}
