package com.citibank.customerapi.controller;

import com.citibank.customerapi.dto.AuthResponse;
import com.citibank.customerapi.dto.CustomerResponse;
import com.citibank.customerapi.dto.LoginRequest;
import com.citibank.customerapi.dto.RegisterRequest;
import com.citibank.customerapi.model.Customer;
import com.citibank.customerapi.security.JwtService;
import com.citibank.customerapi.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/*
 * Login validates credentials (by userName, not customerId - the customerId
 * is generated server-side and isn't meant to be memorized) and hands back a
 * signed JWT alongside the customer's profile (including their admin flag).
 * The frontend attaches that token as a Bearer header on every subsequent
 * request; the API itself stays stateless (no server-side session).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final CustomerService customerService;
    private final JwtService jwtService;

    public AuthController(CustomerService customerService, JwtService jwtService) {
        this.customerService = customerService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        Customer customer = customerService.authenticate(request.getUserName(), request.getPassword());
        return new AuthResponse(jwtService.generateToken(customer), new CustomerResponse(customer));
    }

    // POST /api/auth/register -> public self-service sign-up, 409 if the username is already taken.
    // Always creates a non-admin customer, regardless of what the caller sends.
    // customerId is left null here - CustomerService generates it.
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse register(@RequestBody RegisterRequest request) {
        Customer customer = new Customer(
                null,
                request.getUserName(),
                request.getPassword(),
                request.getName(),
                request.getEmail(),
                request.getPhoneNumber(),
                request.getBranchLocation(),
                request.getPostalCode(),
                false);
        return new CustomerResponse(customerService.registerCustomer(customer));
    }
}
