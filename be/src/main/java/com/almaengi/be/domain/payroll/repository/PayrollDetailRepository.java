package com.almaengi.be.domain.payroll.repository;

import com.almaengi.be.domain.payroll.entity.PayrollDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollDetailRepository extends JpaRepository<PayrollDetail, Long> {

    // 특정 급여의 상세 항목 전체 조회
    List<PayrollDetail> findAllByPayrollId(Long payrollId);

    // 급여 재계산 시 기존 상세 항목 삭제
    void deleteAllByPayrollId(Long payrollId);
}
