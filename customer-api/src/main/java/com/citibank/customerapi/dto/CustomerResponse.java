package com.citibank.customerapi.dto;

import com.citibank.customerapi.model.Customer;

/*
 * DTO (Data Transfer Object) - the shape of data we actually send over the wire.
 * We deliberately leave the password field out here: the REST layer should never
 * serialize sensitive fields just because the domain object happens to have them.
 */
public class CustomerResponse {
    private final String customerId;
    private final String name;
    private final String email;
    private final String phoneNumber;
    private final String branchLocation;
    private final int postalCode;
    private final boolean frozen;
    private final boolean admin;

    public CustomerResponse(Customer customer) {
        this.customerId = customer.getCustomerId();
        this.name = customer.getName();
        this.email = customer.getEmail();
        this.phoneNumber = customer.getPhoneNumber();
        this.branchLocation = customer.getBranchLocation();
        this.postalCode = customer.getPostalCode();
        this.frozen = customer.isFrozen();
        this.admin = customer.isAdmin();
    }

    // Jackson (Spring's default JSON library) turns these getters into JSON fields automatically
    public String getCustomerId() { return customerId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getBranchLocation() { return branchLocation; }
    public int getPostalCode() { return postalCode; }
    public boolean isFrozen() { return frozen; }
    public boolean isAdmin() { return admin; }
}
