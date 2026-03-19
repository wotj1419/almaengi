package com.almaengi.be.domain.store.repository;

import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StoreEmployeeRepository extends JpaRepository<StoreEmployee, Long> {
    // 내가 소속된 전체 매장 목록 조회
    List<StoreEmployee> findByUserId(Long userId);
    // 매장의 전체 직원 목록 조회
    List<StoreEmployee> findByStoreId(Long storeId);
    // 직원이 이미 해당 매장에 소속되어 있는지 여부 확인
    boolean existsByStoreIdAndUserId(Long storeId, Long userId);

    Optional<StoreEmployee> findByStoreIdAndUserId(Long storeId, Long userId);

    /**
     * 특정 매장의 특정 상태 직원 목록 조회 (급여 일괄 생성용)
     */
    List<StoreEmployee> findAllByStoreIdAndStatus(Long storeId, StoreEmployeeStatus status);
}
