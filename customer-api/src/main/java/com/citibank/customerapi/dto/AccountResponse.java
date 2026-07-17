package com.citibank.customerapi.dto;

import com.citibank.customerapi.model.Accounts;
import com.citibank.customerapi.model.Transaction;

import java.time.LocalDate;
import java.util.List;

public class AccountResponse {
    private final String accountType;
    private final String accountNumber;
    private final String nickname;
    private final String primaryOwner;
    // Display name of primaryOwner, resolved server-side (via AccountService.toResponse)
    // so the frontend never has to look up a customerId itself - a non-admin caller
    // has no route to another customer's record, so this must be populated here.
    private final String primaryOwnerName;
    private final List<String> jointOwners;
    private final List<String> jointOwnerNames;
    private final String routingNumber;
    private final double balance;
    private final boolean directDeposit;
    private final double apy;
    private final List<Transaction> transactionHistory;
    private final String status;
    private final Integer termMonths;
    private final LocalDate maturityDate;
    private final boolean matured;

    public AccountResponse(Accounts account, String primaryOwnerName, List<String> jointOwnerNames) {
        this.accountType = account.getAccountType();
        this.accountNumber = account.getAccountNumber();
        this.nickname = account.getNickname();
        this.primaryOwner = account.getPrimaryOwner();
        this.primaryOwnerName = primaryOwnerName;
        this.jointOwners = account.getJointOwners();
        this.jointOwnerNames = jointOwnerNames;
        this.routingNumber = account.getRoutingNumber();
        this.balance = account.getBalance();
        this.directDeposit = account.isDirectDeposit();
        this.apy = account.getAPY();
        this.transactionHistory = account.getTransactionHistory();
        this.status = account.getStatus().name();
        this.termMonths = account.getTermMonths();
        this.maturityDate = account.getMaturityDate();
        this.matured = account.isMatured();
    }

    public String getAccountType() { return accountType; }
    public String getAccountNumber() { return accountNumber; }
    public String getNickname() { return nickname; }
    public String getPrimaryOwner() { return primaryOwner; }
    public String getPrimaryOwnerName() { return primaryOwnerName; }
    public List<String> getJointOwners() { return jointOwners; }
    public List<String> getJointOwnerNames() { return jointOwnerNames; }
    public String getRoutingNumber() { return routingNumber; }
    public double getBalance() { return balance; }
    public boolean isDirectDeposit() { return directDeposit; }
    public double getApy() { return apy; }
    public List<Transaction> getTransactionHistory() { return transactionHistory; }
    public String getStatus() { return status; }
    public Integer getTermMonths() { return termMonths; }
    public LocalDate getMaturityDate() { return maturityDate; }
    public boolean isMatured() { return matured; }
}
