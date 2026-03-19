package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.repository.PayrollRepository;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * 급여 관련 일괄 오케스트레이션을 담당하는 서비스입니다.
 * 개별 급여 생성은 PayrollGenerateService에 위임합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final PayrollGenerateService generateService;

    /**
     * 매장 전체 활성 직원의 월 급여를 일괄 생성합니다.
     * 성공/실패 목록을 모두 반환하여 알림 처리에 활용할 수 있습니다.
     */
    public StorePayrollResult generateStorePayrolls(Long storeId, LocalDate targetMonth) {
        LocalDate normalizedMonth = targetMonth.withDayOfMonth(1);

        List<StoreEmployee> employees = storeEmployeeRepository
                .findAllByStoreIdAndStatus(storeId, StoreEmployeeStatus.WORKING);

        // 한 번의 배치 쿼리로 이미 생성된 직원 ID 조회 (N개 exists 쿼리 방지)
        Set<Long> existingIds = payrollRepository
                .findEmployeeIdsByStoreIdAndTargetMonth(storeId, normalizedMonth);

        List<Payroll> successList = new ArrayList<>();
        List<FailedEmployee> failedList = new ArrayList<>();

        for (StoreEmployee employee : employees) {
            if (existingIds.contains(employee.getId())) {
                log.info("급여 이미 존재 - skip. employeeId: {}", employee.getId());
                continue;
            }

            try {
                Payroll payroll = generateService.generatePayroll(employee.getId(), targetMonth);
                successList.add(payroll);
            } catch (BusinessException e) {
                log.warn("급여 생성 실패 - employeeId: {}, error: {}", employee.getId(), e.getMessage());
                failedList.add(new FailedEmployee(employee.getId(), employee.getUser().getName(), e.getMessage()));
            }
        }

        if (!failedList.isEmpty()) {
            log.warn("급여 일괄 생성 완료 - 성공: {}명, 실패: {}명", successList.size(), failedList.size());
        }

        return new StorePayrollResult(successList, failedList);
    }

    /**
     * 일괄 급여 생성 결과를 담는 record입니다.
     */
    public record StorePayrollResult(
            List<Payroll> successList,
            List<FailedEmployee> failedList
    ) {
        public boolean hasFailures() {
            return !failedList.isEmpty();
        }
    }

    /**
     * 급여 생성에 실패한 직원 정보를 담는 record입니다.
     */
    public record FailedEmployee(
            Long employeeId,
            String employeeName,
            String reason
    ) {}
}
