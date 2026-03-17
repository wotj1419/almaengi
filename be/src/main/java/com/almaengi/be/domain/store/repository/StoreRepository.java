package com.almaengi.be.domain.store.repository;

import com.almaengi.be.domain.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {

    // 특정 사장님이 소유한 매장 목록 조회
    List<Store> findByOwnerIdAndIsClosedFalse(Long userId);
    Optional<Store> findByIdAndIsClosedFalse(Long storeId);

    // 특정 사장님이 소유한 매장 목록 조회
    List<Store> findByOwnerId(Long userId);
}
