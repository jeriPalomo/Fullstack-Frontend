package com.citibank.customerapi.dto;

import com.citibank.customerapi.model.Accounts;

import java.util.List;

public class AccountResponse {
    private final String accountType;
    private final String accountNumber;
    private final String primaryOwner;
    private final List<String> jointOwners;
    private final String routingNumber;
    private final double balance;
    private final boolean directDeposit;
    private final double apy;
    private final List<String> transactionHistory;

    public AccountResponse(Accounts account) {
        this.accountType = account.getAccountType();
        this.accountNumber = account.getAccountNumber();
        this.primaryOwner = account.getPrimaryOwner();
        this.jointOwners = account.getJointOwners();
        this.routingNumber = account.getRoutingNumber();
        this.balance = account.getBalance();
        this.directDeposit = account.isDirectDeposit();
        this.apy = account.getAPY();
        this.transactionHistory = account.getTransactionHistory();
    }

    public String getAccountType() { return accountType; }
    public String getAccountNumber() { return accountNumber; }
    public String getPrimaryOwner() { return primaryOwner; }
    public List<String> getJointOwners() { return jointOwners; }
    public String getRoutingNumber() { return routingNumber; }
    public double getBalance() { return balance; }
    public boolean isDirectDeposit() { return directDeposit; }
    public double getApy() { return apy; }
    public List<String> getTransactionHistory() { return transactionHistory; }
}
