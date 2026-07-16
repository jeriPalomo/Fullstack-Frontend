package com.citibank.customerapi.service;

import com.citibank.customerapi.model.Customer;
import com.citibank.customerapi.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
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

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer getCustomer(String customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer " + customerId + " not found"));
    }

    // Customer IDs are never chosen by the caller - always generated here so
    // nobody can pick their own (or someone else's) ID.
    public Customer createCustomer(Customer customer) {
        customer.setCustomerId(generateCustomerId());
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

    public void deleteCustomer(String customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer " + customerId + " not found");
        }
        customerRepository.deleteById(customerId);
    }

    public Customer setFrozen(String customerId, boolean frozen) {
        Customer customer = getCustomer(customerId);
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

        if (!customer.getPassword().equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
        if (customer.isFrozen()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account is frozen");
        }
        return customer;
    }
}
