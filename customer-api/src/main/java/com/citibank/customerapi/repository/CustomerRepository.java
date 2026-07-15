package com.citibank.customerapi.repository;

import com.citibank.customerapi.model.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
}