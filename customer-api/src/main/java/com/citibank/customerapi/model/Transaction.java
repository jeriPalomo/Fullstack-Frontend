package com.citibank.customerapi.model;

import org.springframework.data.annotation.PersistenceCreator;

import java.time.LocalDateTime;
import java.util.UUID;

/*
 * A single entry in an account's transaction history. Embedded directly inside
 * Accounts.transactionHistory (no separate collection) - id is generated here so
 * every entry is uniquely identifiable/keyable on the frontend.
 */
public class Transaction {
    public enum Type { DEPOSIT, WITHDRAW, TRANSFER_OUT, TRANSFER_IN }

    private final String id;
    private final Type type;
    private final double amount;
    private final double balanceAfter;
    private final String description;
    private final LocalDateTime timestamp;

    public Transaction(Type type, double amount, double balanceAfter, String description) {
        this(UUID.randomUUID().toString(), type, amount, balanceAfter, description, LocalDateTime.now());
    }

    @PersistenceCreator
    public Transaction(String id, Type type, double amount, double balanceAfter, String description, LocalDateTime timestamp) {
        this.id = id;
        this.type = type;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public Type getType() { return type; }
    public double getAmount() { return amount; }
    public double getBalanceAfter() { return balanceAfter; }
    public String getDescription() { return description; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
