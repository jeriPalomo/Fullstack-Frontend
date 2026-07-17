package com.citibank.customerapi.controller;

import com.citibank.customerapi.dto.AccountResponse;
import com.citibank.customerapi.dto.CustomerResponse;
import com.citibank.customerapi.model.Customer;
import com.citibank.customerapi.service.AccountService;
import com.citibank.customerapi.service.CustomerService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

import java.util.List;

/*
 * @RestController = @Controller + @ResponseBody: every method's return value is
 * serialized straight to the HTTP response body (as JSON), instead of resolving
 * to an HTML view like a traditional MVC controller would.
 *
 * @RequestMapping sets the base path all methods in this class share.
 */
@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final AccountService accountService;

    // Constructor injection: Spring sees this class needs a CustomerService and
    // hands it the one it manages as a bean.
    public CustomerController(CustomerService customerService, AccountService accountService) {
        this.customerService = customerService;
        this.accountService = accountService;
    }

    // GET /api/customers -> list of every customer
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<CustomerResponse> getAllCustomers() {
        return customerService.getAllCustomers().stream()
                .map(CustomerResponse::new)
                .toList();
    }

    // GET /api/customers/{id} -> a single customer, or 404 if not found
    @PreAuthorize("hasRole('ADMIN') or #customerId == authentication.name")
    @GetMapping("/{customerId}")
    public CustomerResponse getCustomer(@PathVariable String customerId) {
        return new CustomerResponse(customerService.getCustomer(customerId));
    }

    // GET /api/customers/{id}/accounts -> every account this customer owns (primary or joint)
    @PreAuthorize("hasRole('ADMIN') or #customerId == authentication.name")
    @GetMapping("/{customerId}/accounts")
    public List<AccountResponse> getCustomerAccounts(@PathVariable String customerId) {
        customerService.getCustomer(customerId);
        return accountService.getAccountsForCustomer(customerId).stream().map(accountService::toResponse).toList();
    }

    // POST /api/customers -> creates a new customer, 409 if the id is already taken
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse createCustomer(@RequestBody Customer customer) {
        return new CustomerResponse(customerService.createCustomer(customer));
    }

    // PUT /api/customers/{id}/freeze -> freezes the customer's login. Admins can
    // only freeze customers (never delete), and never another admin - the latter
    // is enforced in CustomerService.setFrozen since it applies to both directions.
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{customerId}/freeze")
    public CustomerResponse freezeCustomer(@PathVariable String customerId) {
        return new CustomerResponse(customerService.setFrozen(customerId, true));
    }

    // PUT /api/customers/{id}/unfreeze -> unfreezes the customer's login
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{customerId}/unfreeze")
    public CustomerResponse unfreezeCustomer(@PathVariable String customerId) {
        return new CustomerResponse(customerService.setFrozen(customerId, false));
    }
}
