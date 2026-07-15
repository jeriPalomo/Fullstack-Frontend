package com.citibank.customerapi.controller;

import com.citibank.customerapi.dto.CustomerResponse;
import com.citibank.customerapi.dto.LoginRequest;
import com.citibank.customerapi.dto.RegisterRequest;
import com.citibank.customerapi.model.Customer;
import com.citibank.customerapi.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/*
 * Stateless login: validates credentials and hands back the customer's profile
 * (including their admin flag) for the frontend to hold onto. No session/token
 * is issued - the frontend keeps the logged-in customerId in memory/localStorage
 * and sends it with subsequent requests.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final CustomerService customerService;

    public AuthController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping("/login")
    public CustomerResponse login(@RequestBody LoginRequest request) {
        return new CustomerResponse(customerService.authenticate(request.getCustomerId(), request.getPassword()));
    }

    // POST /api/auth/register -> public self-service sign-up, 409 if the id is already taken.
    // Always creates a non-admin customer, regardless of what the caller sends.
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse register(@RequestBody RegisterRequest request) {
        Customer customer = new Customer(
                request.getCustomerId(),
                request.getPassword(),
                request.getName(),
                request.getEmail(),
                request.getPhoneNumber(),
                request.getBranchLocation(),
                request.getPostalCode(),
                false);
        return new CustomerResponse(customerService.createCustomer(customer));
    }
}
