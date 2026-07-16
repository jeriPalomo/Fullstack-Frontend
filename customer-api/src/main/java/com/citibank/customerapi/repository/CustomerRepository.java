package com.citibank.customerapi.repository;

import com.citibank.customerapi.model.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByUserName(String userName);
    Optional<Customer> findByUserName(String userName);
}