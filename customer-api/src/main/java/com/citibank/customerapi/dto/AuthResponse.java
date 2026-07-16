package com.citibank.customerapi.dto;

/*
 * Response body for a successful login: the issued JWT plus the customer's
 * profile, so the frontend can hold onto both from a single call.
 */
public class AuthResponse {
    private final String token;
    private final CustomerResponse customer;

    public AuthResponse(String token, CustomerResponse customer) {
        this.token = token;
        this.customer = customer;
    }

    public String getToken() { return token; }
    public CustomerResponse getCustomer() { return customer; }
}
