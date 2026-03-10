package com.almaengi.be.domain.store.repository;

import com.almaengi.be.domain.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRepository extends JpaRepository<Store, Long> {
}
