package com.almaengi.be.domain.store.repository;

import com.almaengi.be.domain.store.entity.StoreEmployee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StoreEmployeeRepository extends JpaRepository<StoreEmployee, Long> {
    Optional<StoreEmployee> findByStoreIdAndUserId(Long storeId, Long userId);
}
