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


    /**
     * 승인된 급여를 조회합니다. (이체 대상)
     * employee → user를 fetch join하여 계좌 정보에 접근할 수 있습니다.
     */
    @Query("SELECT p FROM Payroll p " +
            "JOIN FETCH p.employee e " +
            "JOIN FETCH e.user u " +
            "WHERE e.store.id = :storeId AND p.targetMonth = :targetMonth " +
            "AND p.isApproved = true")
    List<Payroll> findApprovedByStoreIdAndTargetMonth(
            @Param("storeId") Long storeId,
            @Param("targetMonth") LocalDate targetMonth);

    // 사장님 대시보드: Payroll + StoreEmployee + User를 한 번에 조회 (N+1 방지, 직원명 오름차순)
    @Query("SELECT p FROM Payroll p " +
            "JOIN FETCH p.employee e " +
            "JOIN FETCH e.user u " +
            "WHERE e.store.id = :storeId AND p.targetMonth = :targetMonth " +
            "ORDER BY u.name ASC")
    List<Payroll> findAllByStoreIdAndTargetMonthWithEmployee(
            @Param("storeId") Long storeId,
            @Param("targetMonth") LocalDate targetMonth);

    /**
     * 급여명세서 조회용: Payroll + employee + user + store + owner를 한 번에 조회합니다.
     * 권한 검증(사장님/본인)과 파일 경로 구성에 필요합니다.
     */
    @Query("SELECT p FROM Payroll p " +
            "JOIN FETCH p.employee e " +
            "JOIN FETCH e.user u " +
            "JOIN FETCH e.store s " +
            "JOIN FETCH s.owner o " +
            "WHERE p.id = :payrollId")
    Optional<Payroll> findByIdWithEmployeeAndStoreAndOwner(@Param("payrollId") Long payrollId);

    /**
     * 급여명세서 생성용: 매장의 특정 월 Payroll을 employee+user+store와 함께 조회합니다.
     */
    @Query("SELECT p FROM Payroll p " +
            "JOIN FETCH p.employee e " +
            "JOIN FETCH e.user u " +
            "JOIN FETCH e.store s " +
            "WHERE s.id = :storeId AND p.targetMonth = :targetMonth")
    List<Payroll> findAllByStoreIdAndTargetMonthWithEmployeeAndStore(
            @Param("storeId") Long storeId,
            @Param("targetMonth") LocalDate targetMonth);
}
