package com.almaengi.be.domain.payroll.repository;

import com.almaengi.be.domain.payroll.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    // 특정 직원의 특정 월 급여 조회
    Optional<Payroll> findByEmployeeIdAndTargetMonth(Long employeeId, LocalDate targetMonth);

    // 특정 매장의 특정 월 급여 전체 조회
    List<Payroll> findAllByEmployeeStoreIdAndTargetMonth(Long storeId, LocalDate targetMonth);

    // 중복 생성 방지용
    boolean existsByEmployeeIdAndTargetMonth(Long employeeId, LocalDate targetMonth);

    // 매장 전체 직원의 급여 존재 여부를 한 번에 조회 (배치 최적화)
    @Query("SELECT p.employee.id FROM Payroll p " +
            "WHERE p.employee.store.id = :storeId AND p.targetMonth = :targetMonth")
    Set<Long> findEmployeeIdsByStoreIdAndTargetMonth(
            @Param("storeId") Long storeId,
            @Param("targetMonth") LocalDate targetMonth);
}
