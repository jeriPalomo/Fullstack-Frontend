package com.citibank.customerapi.dto;

/*
 * Request body for an admin opening a new account for a customer.
 */
public class CreateAccountRequest {
    private String accountType;
    private String accountNumber;
    private String primaryOwner;
    private String routingNumber;
    private double balance;
    private boolean directDeposit;
    private double apy;

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getPrimaryOwner() { return primaryOwner; }
    public void setPrimaryOwner(String primaryOwner) { this.primaryOwner = primaryOwner; }

    public String getRoutingNumber() { return routingNumber; }
    public void setRoutingNumber(String routingNumber) { this.routingNumber = routingNumber; }

    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }

    public boolean isDirectDeposit() { return directDeposit; }
    public void setDirectDeposit(boolean directDeposit) { this.directDeposit = directDeposit; }

    public double getApy() { return apy; }
    public void setApy(double apy) { this.apy = apy; }
}
