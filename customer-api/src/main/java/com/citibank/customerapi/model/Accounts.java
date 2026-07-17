package com.citibank.customerapi.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.PersistenceCreator;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/*
 * Accounts class storing account details and transaction history.
 * primaryOwner/jointOwners store customerId references rather than embedding
 * Customer documents, so an account is owned independently of any one customer record.
*/
@Document(collection = "accounts")
public class Accounts {

    public enum AccountStatus { ACTIVE, FROZEN, CLOSED }

    private String accountType;
    @Id
    private String accountNumber;
    private String nickname;
    private String primaryOwner;
    private List<String> jointOwners;
    private String routingNumber;
    private double balance;
    private boolean directDeposit;
    private double APY;
    private List<Transaction> transactionHistory;
    // Not a constructor param so existing documents without this field
    // deserialize to ACTIVE via this initializer, same as new accounts.
    private AccountStatus status = AccountStatus.ACTIVE;
    // Certificate (CD) accounts only - null for every other account type.
    private Integer termMonths;
    private LocalDate maturityDate;

    @PersistenceCreator
    public Accounts(String accountType, String accountNumber, String primaryOwner, List<String> jointOwners, String routingNumber, double balance, boolean directDeposit, double APY, Integer termMonths, LocalDate maturityDate) {
        this.accountType = accountType;
        this.accountNumber = accountNumber;
        this.primaryOwner = primaryOwner;

        // If jointOwners is null, initialize it to an empty list to avoid NullPointerException
        this.jointOwners = jointOwners != null ? jointOwners : new ArrayList<>();

        this.routingNumber = routingNumber;
        this.balance = balance;
        this.directDeposit = directDeposit;
        this.APY = APY;
        this.termMonths = termMonths;
        this.maturityDate = maturityDate;

        this.transactionHistory = new ArrayList<>();
    }

    // Getters
    public double getBalance() { return balance; }
    public double getAPY() { return APY; }
    public boolean isDirectDeposit() { return directDeposit; }
    public String getAccountType() { return accountType; }
    public String getAccountNumber() { return accountNumber; }
    public String getNickname() { return nickname; }
    public String getRoutingNumber() { return routingNumber; }
    public String getPrimaryOwner() { return primaryOwner; }
    public List<String> getJointOwners() { return jointOwners; }
    public List<Transaction> getTransactionHistory() { return transactionHistory; }
    public AccountStatus getStatus() { return status; }
    public boolean isFrozen() { return status == AccountStatus.FROZEN; }
    public boolean isClosed() { return status == AccountStatus.CLOSED; }
    public Integer getTermMonths() { return termMonths; }
    public LocalDate getMaturityDate() { return maturityDate; }
    public boolean isCertificate() { return "Certificate".equals(accountType); }
    // No maturity date means the lock doesn't apply (non-CD accounts), so this is
    // vacuously true for them; CDs are matured once today reaches maturityDate.
    public boolean isMatured() { return maturityDate == null || !LocalDate.now().isBefore(maturityDate); }

    public void setNickname(String nickname) { this.nickname = nickname; }

    public void freeze() { status = AccountStatus.FROZEN; }
    public void unfreeze() { status = AccountStatus.ACTIVE; }
    public void close() { status = AccountStatus.CLOSED; }

    public void addJointOwner(String name) {
        if (!this.jointOwners.contains(name)) {
            this.jointOwners.add(name);
        }
    }

    // Methods
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            logTransaction(Transaction.Type.DEPOSIT, amount, "Deposit");
        }
    }

    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            logTransaction(Transaction.Type.WITHDRAW, amount, "Withdrawal");
        }
    }

    public boolean transferTo(Accounts destinationAccount, double amount) {
        if (destinationAccount == null) {
            return false;
        }

        if (amount > 0 && this.balance >= amount) {
            this.balance -= amount;
            logTransaction(Transaction.Type.TRANSFER_OUT, amount, "Transfer to " + destinationAccount.getAccountNumber());

            destinationAccount.receiveTransfer(this.accountNumber, amount);
            return true;
        }

        return false;
    }

    private void receiveTransfer(String fromAccountNumber, double amount) {
        if (amount > 0) {
            this.balance += amount;
            logTransaction(Transaction.Type.TRANSFER_IN, amount, "Transfer from " + fromAccountNumber);
        }
    }

    private void logTransaction(Transaction.Type type, double amount, String description) {
        transactionHistory.add(new Transaction(type, amount, this.balance, description));
    }
}
