package com.almaengi.be.domain.contract.repository;

import com.almaengi.be.domain.contract.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    // ─── Fetch Join 쿼리 (N+1 방지) ───

    @Query("SELECT c FROM Contract c " +
            "JOIN FETCH c.storeEmployee se " +
            "JOIN FETCH se.store s " +
            "JOIN FETCH s.owner " +
            "JOIN FETCH se.user " +
            "WHERE c.id = :contractId AND se.store.id = :storeId")
    Optional<Contract> findByIdAndStoreIdWithDetails(@Param("contractId") Long contractId,
                                                     @Param("storeId") Long storeId);

    @Query("SELECT c FROM Contract c " +
            "JOIN FETCH c.storeEmployee se " +
            "JOIN FETCH se.user " +
            "WHERE se.store.id = :storeId " +
            "ORDER BY c.createdAt DESC")
    List<Contract> findAllByStoreIdWithDetails(@Param("storeId") Long storeId);

    @Query("SELECT c FROM Contract c " +
            "JOIN FETCH c.storeEmployee se " +
            "JOIN FETCH se.user " +
            "WHERE se.store.id = :storeId AND se.user.id = :userId " +
            "ORDER BY c.createdAt DESC")
    List<Contract> findAllByStoreIdAndUserIdWithDetails(@Param("storeId") Long storeId,
                                                        @Param("userId") Long userId);

    // ─── 중복 계약 검증 쿼리 ───

    @Query("SELECT COUNT(c) > 0 FROM Contract c " +
            "WHERE c.storeEmployee.id = :employeeId " +
            "AND c.contractStartDate <= :endDate " +
            "AND (c.contractEndDate IS NULL OR c.contractEndDate >= :startDate)")
    boolean existsOverlappingContract(@Param("employeeId") Long employeeId,
                                      @Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(c) > 0 FROM Contract c " +
            "WHERE c.storeEmployee.id = :employeeId " +
            "AND c.contractEndDate IS NULL")
    boolean existsOpenEndedContract(@Param("employeeId") Long employeeId);
}
