package com.citibank.customerapi.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.PersistenceCreator;
import org.springframework.data.mongodb.core.mapping.Document;

/*
 * Customer class representing a bank customer.
 * Accounts are stored in their own collection (see Accounts) and reference this
 * customer's id as primaryOwner/jointOwner, rather than being embedded here.
*/
@Document(collection = "customers")
public class Customer {
    @Id
    private String customerId;
    private String userName;
    private String password;
    private String name;
    private String email;
    private String phoneNumber;
    private String branchLocation;
    private int postalCode;
    private boolean isFrozen;
    private boolean admin;

    @PersistenceCreator
    public Customer(String customerId, String userName, String password, String name, String email, String phoneNumber, String branchLocation, int postalCode, boolean admin) {
        this.customerId = customerId;
        this.userName = userName;
        this.password = password;
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.branchLocation = branchLocation;
        this.postalCode = postalCode;
        this.isFrozen = false;
        this.admin = admin;
    }

    public Customer(String customerId, String userName, String password, String name, String email, String phoneNumber, String branchLocation, int postalCode) {
        this(customerId, userName, password, name, email, phoneNumber, branchLocation, postalCode, false);
    }

    // Getters + Setters
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

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

    public boolean isFrozen() { return isFrozen; }

    public boolean isAdmin() { return admin; }
    public void setAdmin(boolean admin) { this.admin = admin; }

    // Methods
    public void freezeAccount() { isFrozen = true; }
    public void unfreezeAccount() { isFrozen = false; }
}
