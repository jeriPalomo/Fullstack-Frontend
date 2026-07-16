package com.citibank.customerapi.security;

import com.citibank.customerapi.model.Accounts;
import com.citibank.customerapi.service.AccountService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/*
 * Ownership predicates used from @PreAuthorize SpEL on AccountController
 * methods. Kept out of AccountService so that class stays focused on domain
 * business rules (balance math, frozen/closed checks) with no Spring Security
 * coupling; this is purely an authorization check that happens to need the
 * same lookup AccountService already exposes.
 */
@Component("accountAccess")
public class AccountAccessGuard {

    private final AccountService accountService;

    public AccountAccessGuard(AccountService accountService) {
        this.accountService = accountService;
    }

    public boolean isOwner(String accountNumber, Authentication authentication) {
        Accounts account = accountService.getAccount(accountNumber);
        String customerId = authentication.getName();
        return account.getPrimaryOwner().equals(customerId) || account.getJointOwners().contains(customerId);
    }

    public boolean isPrimaryOwner(String accountNumber, Authentication authentication) {
        Accounts account = accountService.getAccount(accountNumber);
        return account.getPrimaryOwner().equals(authentication.getName());
    }
}
