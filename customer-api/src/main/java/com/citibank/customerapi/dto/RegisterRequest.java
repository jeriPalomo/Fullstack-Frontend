package com.citibank.customerapi.dto;

/*
 * Request body for public self-service sign-up. Deliberately narrower than the
 * Customer model - no `admin` field, so a caller can't grant themselves admin
 * by including it in the JSON body the way the admin-only POST /customers does.
 * There's also no `customerId` field - that's always generated server-side.
 */
public class RegisterRequest {
    private String userName;
    private String password;
    private String name;
    private String email;
    private String phoneNumber;
    private String branchLocation;
    private int postalCode;

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getBranchLocation() { return branchLocation; }
    public void setBranchLocation(String branchLocation) { this.branchLocation = branchLocation; }

    public int getPostalCode() { return postalCode; }
    public void setPostalCode(int postalCode) { this.postalCode = postalCode; }
}
