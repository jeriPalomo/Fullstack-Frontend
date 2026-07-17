package com.citibank.customerapi.config;

import com.citibank.customerapi.model.Accounts;
import com.citibank.customerapi.model.Customer;
import com.citibank.customerapi.repository.AccountRepository;
import com.citibank.customerapi.repository.CustomerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/*
 * Seeds demo customers, an admin, and accounts into MongoDB on startup, but
 * only if the customers collection is empty - so restarts don't keep
 * duplicating data.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(CustomerRepository customerRepository, AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (customerRepository.count() > 0) {
            return;
        }

        // Demo credentials are still sonia.jain/pass123, nevil.johnson/pass123,
        // carla.gomez/pass123, priya.admin/admin123 - only the stored form is hashed.
        customerRepository.save(new Customer("C001", "sonia.jain", passwordEncoder.encode("pass123"), "Sonia Jain", "sonia@example.com", "555-0101", "New York", 10001, false));
        customerRepository.save(new Customer("C002", "nevil.johnson", passwordEncoder.encode("pass123"), "Nevil Johnson", "nevil@example.com", "555-0102", "Chicago", 60601, false));
        customerRepository.save(new Customer("C003", "carla.gomez", passwordEncoder.encode("pass123"), "Carla Gomez", "carla@example.com", "555-0103", "Los Angeles", 90001, false));
        customerRepository.save(new Customer("A001", "priya.admin", passwordEncoder.encode("admin123"), "Priya Shah", "priya@example.com", "555-0199", "New York", 10001, true));

        accountRepository.save(new Accounts("Checking", "1000000001", "C001", null, "021000021", 2500.00, true, 0.01, null, null));
        accountRepository.save(new Accounts("Savings", "1000000002", "C001", null, "021000021", 10000.00, false, 3.75, null, null));
        accountRepository.save(new Accounts("Checking", "1000000003", "C002", null, "021000021", 750.50, true, 0.01, null, null));
        accountRepository.save(new Accounts("Savings", "1000000004", "C003", null, "021000021", 5320.00, false, 3.75, null, null));
        accountRepository.save(new Accounts("Certificate", "1000000005", "C002", null, "021000021", 5000.00, false, 4.50, 12, LocalDate.now().plusMonths(12)));
    }
}