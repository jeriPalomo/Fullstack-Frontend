package com.citibank.customerapi.service;

import com.citibank.customerapi.model.Customer;
import com.citibank.customerapi.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/*
 * Holds the business rules for customers (existence checks, not-found/conflict
 * handling) so the controller only deals with HTTP concerns and the repository
 * only deals with persistence.
 */
@Service
public class CustomerService {

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

    public Customer createCustomer(Customer customer) {
        if (customerRepository.existsById(customer.getCustomerId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Customer " + customer.getCustomerId() + " already exists");
        }
        return customerRepository.save(customer);
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

    public Customer authenticate(String customerId, String password) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid customer ID or password"));

        if (!customer.getPassword().equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid customer ID or password");
        }
        if (customer.isFrozen()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account is frozen");
        }
        return customer;
    }
}
