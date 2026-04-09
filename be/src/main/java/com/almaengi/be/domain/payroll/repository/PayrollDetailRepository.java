package com.almaengi.be.domain.payroll.repository;

import com.almaengi.be.domain.payroll.entity.PayrollDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PayrollDetailRepository extends JpaRepository<PayrollDetail, Long> {

    /**
     * 매장의 특정 월 수당(ALLOWANCE) 항목을 배치 조회합니다.
     * 급여 지출 요약 API에서 주휴수당/연장수당/야간수당 합계를 구할 때 사용합니다.
     */
    @Query("SELECT d FROM PayrollDetail d " +
            "JOIN d.payroll p " +
            "JOIN p.employee e " +
            "WHERE e.store.id = :storeId AND p.targetMonth = :targetMonth " +
            "AND d.detailType = com.almaengi.be.domain.payroll.type.PayrollDetailType.ALLOWANCE")
    List<PayrollDetail> findAllowancesByStoreIdAndTargetMonth(
            @Param("storeId") Long storeId,
            @Param("targetMonth") LocalDate targetMonth);

    /**
     * 특정 급여의 상세 항목을 비즈니스 순서대로 조회합니다.
     * BASE(기본급) → ALLOWANCE(수당) → DEDUCTION(공제) → OTHER(기타) 순,
     * 같은 타입 내에서는 ID 오름차순.
     *
     * EnumType.STRING 저장이라 알파벳순(ALLOWANCE < BASE)이 되므로
     * CASE WHEN으로 비즈니스 순서를 명시합니다.
     */
    @Query("SELECT d FROM PayrollDetail d WHERE d.payroll.id = :payrollId " +
            "ORDER BY CASE d.detailType " +
            "WHEN com.almaengi.be.domain.payroll.type.PayrollDetailType.BASE THEN 0 " +
            "WHEN com.almaengi.be.domain.payroll.type.PayrollDetailType.ALLOWANCE THEN 1 " +
            "WHEN com.almaengi.be.domain.payroll.type.PayrollDetailType.DEDUCTION THEN 2 " +
            "WHEN com.almaengi.be.domain.payroll.type.PayrollDetailType.OTHER THEN 3 " +
            "END ASC, d.id ASC")
    List<PayrollDetail> findAllByPayrollIdOrdered(@Param("payrollId") Long payrollId);

    // 급여 재계산 시 기존 상세 항목 삭제
    void deleteAllByPayrollId(Long payrollId);
}
