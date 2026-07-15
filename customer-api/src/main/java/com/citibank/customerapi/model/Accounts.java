package com.citibank.customerapi.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.PersistenceCreator;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/*
 * Accounts class storing account details and transaction history.
 * primaryOwner/jointOwners store customerId references rather than embedding
 * Customer documents, so an account is owned independently of any one customer record.
*/
@Document(collection = "accounts")
public class Accounts {
    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm:ss");

    private String accountType;
    @Id
    private String accountNumber;
    private String primaryOwner;
    private List<String> jointOwners;
    private String routingNumber;
    private double balance;
    private boolean directDeposit;
    private double APY;
    private List<String> transactionHistory;

    @PersistenceCreator
    public Accounts(String accountType, String accountNumber, String primaryOwner, List<String> jointOwners, String routingNumber, double balance, boolean directDeposit, double APY) {
        this.accountType = accountType;
        this.accountNumber = accountNumber;
        this.primaryOwner = primaryOwner;

        // If jointOwners is null, initialize it to an empty list to avoid NullPointerException
        this.jointOwners = jointOwners != null ? jointOwners : new ArrayList<>();

        this.routingNumber = routingNumber;
        this.balance = balance;
        this.directDeposit = directDeposit;
        this.APY = APY;

        this.transactionHistory = new ArrayList<>();
        logTransaction("Account created. Initial balance: $" + balance);
    }

    // Getters
    public double getBalance() { return balance; }
    public double getAPY() { return APY; }
    public boolean isDirectDeposit() { return directDeposit; }
    public String getAccountType() { return accountType; }
    public String getAccountNumber() { return accountNumber; }
    public String getRoutingNumber() { return routingNumber; }
    public String getPrimaryOwner() { return primaryOwner; }
    public List<String> getJointOwners() { return jointOwners; }
    public List<String> getTransactionHistory() { return transactionHistory; }

    public void addJointOwner(String name) {
        if (!this.jointOwners.contains(name)) {
            this.jointOwners.add(name);
        }
    }

    // Methods
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            logTransaction("Deposited: $" + amount + ". New balance: $" + balance);
        }
    }

    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            logTransaction("Withdrew: $" + amount + ". New balance: $" + balance);
        }
    }

    public boolean transferTo(Accounts destinationAccount, double amount) {
        if (destinationAccount == null) {
            logTransaction("Transfer failed: Invalid destination account.");
            return false;
        }

        if (amount > 0 && this.balance >= amount) {
            this.balance -= amount;
            logTransaction("Transferred Out: $" + amount + " to " + destinationAccount.getAccountNumber() + " | New Balance: $" + this.balance);

            destinationAccount.receiveTransfer(this.accountNumber, amount);
            return true;
        }

        logTransaction("Failed transfer attempt of: $" + amount + " to " + destinationAccount.getAccountNumber());
        return false;
    }

    private void receiveTransfer(String fromAccountNumber, double amount) {
        if (amount > 0) {
            this.balance += amount;
            logTransaction("Received Transfer: $" + amount + " from " + fromAccountNumber + " | New Balance: $" + this.balance);
        }
    }

    // Adds MM/dd/yyyy HH:mm:ss timestamp to transaction logs
    private void logTransaction(String message) {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        transactionHistory.add("[" + timestamp + "] " + message);
    }
}
