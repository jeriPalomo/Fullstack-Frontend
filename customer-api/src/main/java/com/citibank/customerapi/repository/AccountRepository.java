package com.citibank.customerapi.repository;

import com.citibank.customerapi.model.Accounts;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AccountRepository extends MongoRepository<Accounts, String> {
    List<Accounts> findByPrimaryOwnerOrJointOwnersContaining(String primaryOwner, String jointOwner);
}
