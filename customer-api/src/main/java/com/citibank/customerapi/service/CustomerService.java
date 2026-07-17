package com.citibank.customerapi.service;

import com.citibank.customerapi.model.Customer;
import com.citibank.customerapi.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

/*
 * Holds the business rules for customers (existence checks, not-found/conflict
 * handling) so the controller only deals with HTTP concerns and the repository
 * only deals with persistence.
 */
@Service
public class CustomerService {

    // name@domain.tld shape - deliberately not restricted to specific TLDs like .com/.net.
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(CustomerRepository customerRepository, PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer getCustomer(String customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer " + customerId + " not found"));
    }

    // Customer IDs are never chosen by the caller - always generated here so
    // nobody can pick their own (or someone else's) ID. Password is hashed here
    // too, so both entry points (self-registration and admin-create) get it -
    // registerCustomer() delegates to this method after its own validation.
    public Customer createCustomer(Customer customer) {
        customer.setCustomerId(generateCustomerId());
        customer.setPassword(passwordEncoder.encode(customer.getPassword()));
        return customerRepository.save(customer);
    }

    private String generateCustomerId() {
        return "C" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    // Public self-service sign-up: same ID generation as createCustomer, plus
    // field-format and duplicate-username/email/phone checks that only apply
    // when a customer is registering themselves (not when an admin creates one).
    public Customer registerCustomer(Customer customer) {
        if (customer.getUserName() == null || customer.getUserName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        if (customer.getPassword() == null || customer.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }
        if (customer.getName() == null || customer.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        if (customer.getEmail() == null || !EMAIL_PATTERN.matcher(customer.getEmail()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid email address is required");
        }
        if (customer.getPhoneNumber() == null || customer.getPhoneNumber().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number is required");
        }
        if (customer.getPostalCode() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid postal code is required");
        }
        if (customerRepository.existsByUserName(customer.getUserName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username " + customer.getUserName() + " is already taken");
        }
        if (customerRepository.existsByEmail(customer.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with email " + customer.getEmail() + " already exists");
        }
        if (customerRepository.existsByPhoneNumber(customer.getPhoneNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with phone number " + customer.getPhoneNumber() + " already exists");
        }
        return createCustomer(customer);
    }

    // Admins can freeze a customer's login but never another admin - the admin
    // panel doesn't expose an equivalent employee-suspension flow here, so this
    // stays a hard block rather than a role check the caller could satisfy.
    public Customer setFrozen(String customerId, boolean frozen) {
        Customer customer = getCustomer(customerId);
        if (customer.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin accounts can't be frozen");
        }
        if (frozen) {
            customer.freezeAccount();
        } else {
            customer.unfreezeAccount();
        }
        return customerRepository.save(customer);
    }

    public Customer authenticate(String userName, String password) {
        Customer customer = customerRepository.findByUserName(userName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        if (!passwordEncoder.matches(password, customer.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
        if (customer.isFrozen()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account is frozen");
        }
        return customer;
    }
}
