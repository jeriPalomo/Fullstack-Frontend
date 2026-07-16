package com.citibank.customerapi.dto;

import com.citibank.customerapi.model.Accounts;
import com.citibank.customerapi.model.Transaction;

import java.util.List;

public class AccountResponse {
    private final String accountType;
    private final String accountNumber;
    private final String nickname;
    private final String primaryOwner;
    private final List<String> jointOwners;
    private final String routingNumber;
    private final double balance;
    private final boolean directDeposit;
    private final double apy;
    private final List<Transaction> transactionHistory;
    private final String status;

    public AccountResponse(Accounts account) {
        this.accountType = account.getAccountType();
        this.accountNumber = account.getAccountNumber();
        this.nickname = account.getNickname();
        this.primaryOwner = account.getPrimaryOwner();
        this.jointOwners = account.getJointOwners();
        this.routingNumber = account.getRoutingNumber();
        this.balance = account.getBalance();
        this.directDeposit = account.isDirectDeposit();
        this.apy = account.getAPY();
        this.transactionHistory = account.getTransactionHistory();
        this.status = account.getStatus().name();
    }

    public String getAccountType() { return accountType; }
    public String getAccountNumber() { return accountNumber; }
    public String getNickname() { return nickname; }
    public String getPrimaryOwner() { return primaryOwner; }
    public List<String> getJointOwners() { return jointOwners; }
    public String getRoutingNumber() { return routingNumber; }
    public double getBalance() { return balance; }
    public boolean isDirectDeposit() { return directDeposit; }
    public double getApy() { return apy; }
    public List<Transaction> getTransactionHistory() { return transactionHistory; }
    public String getStatus() { return status; }
}
