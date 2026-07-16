package com.citibank.customerapi.dto;

/*
 * Request body for opening a new account. accountNumber/routingNumber are
 * intentionally absent - the server always generates them (see AccountService).
 */
public class CreateAccountRequest {
    private String accountType;
    private String nickname;
    private String primaryOwner;
    private double balance;
    private boolean directDeposit;
    private double apy;

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public String getPrimaryOwner() { return primaryOwner; }
    public void setPrimaryOwner(String primaryOwner) { this.primaryOwner = primaryOwner; }

    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }

    public boolean isDirectDeposit() { return directDeposit; }
    public void setDirectDeposit(boolean directDeposit) { this.directDeposit = directDeposit; }

    public double getApy() { return apy; }
    public void setApy(double apy) { this.apy = apy; }
}
