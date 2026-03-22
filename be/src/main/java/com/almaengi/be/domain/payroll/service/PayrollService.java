package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.entity.PayrollDetail;
import com.almaengi.be.domain.payroll.repository.PayrollDetailRepository;
import com.almaengi.be.domain.payroll.repository.PayrollRepository;
import com.almaengi.be.domain.payroll.type.PayrollDetailType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.ObjectProvider;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 급여 생성 및 일괄 오케스트레이션을 담당하는 서비스입니다.
 * 개별 급여 생성은 독립 트랜잭션(REQUIRES_NEW)으로 처리되어,
 * 한 직원의 실패가 다른 직원에게 영향을 주지 않습니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final PayrollDetailRepository payrollDetailRepository;
    private final AttendanceRepository attendanceRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final StoreRepository storeRepository;
    private final PayrollCalculationService calculationService;

    /**
     * 같은 클래스 내에서 generatePayroll()을 호출할 때
     * REQUIRES_NEW 트랜잭션이 적용되도록 프록시 객체를 주입받습니다.
     * (Spring AOP는 내부 호출(this.method())에는 프록시를 적용하지 않기 때문)
     * ObjectProvider를 사용하여 지연 조회로 순환 참조를 방지합니다.
     */
    private final ObjectProvider<PayrollService> selfProvider;

    // ─── 일괄 생성 (오케스트레이션) ───

    /**
     * 매장 전체 활성 직원의 월 급여를 일괄 생성합니다.
     * 성공/실패 목록을 모두 반환하여 알림 처리에 활용할 수 있습니다.
     */
    public StorePayrollResult generateStorePayrolls(Long userId, Long storeId, LocalDate targetMonth) {
        validateStoreOwnership(userId, storeId);

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
                // 프록시를 통해 호출해야 REQUIRES_NEW 트랜잭션이 적용됨
                Payroll payroll = selfProvider.getObject().generatePayroll(employee.getId(), targetMonth);
                successList.add(payroll);
            } catch (BusinessException e) {
                log.warn("급여 생성 실패 - employeeId: {}, error: {}", employee.getId(), e.getMessage());
                failedList.add(new FailedEmployee(employee.getId(), employee.getUser().getName(), e.getMessage()));
            } catch (Exception e) {
                log.error("급여 생성 중 예상치 못한 오류 - employeeId: {}", employee.getId(), e);
                failedList.add(new FailedEmployee(employee.getId(), employee.getUser().getName(), "급여 생성 중 시스템 오류가 발생했습니다."));
            }
        }

        if (!failedList.isEmpty()) {
            log.warn("급여 일괄 생성 완료 - 성공: {}명, 실패: {}명", successList.size(), failedList.size());
        }

        return new StorePayrollResult(successList, failedList);
    }

    // ─── 개별 급여 생성 ───

    /**
     * 한 직원의 월 급여를 계산하여 payrolls + payroll_details에 저장합니다.
     * 독립 트랜잭션으로 처리되어 한 직원의 실패가 다른 직원에게 영향을 주지 않습니다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Payroll generatePayroll(Long employeeId, LocalDate targetMonth) {

        // 1. 월 1일로 정규화
        LocalDate normalizedMonth = targetMonth.withDayOfMonth(1);

        // 2. 데이터 정합성 보장: 단독 호출 시에도 중복 생성을 방지하는 안전장치
        if (payrollRepository.existsByEmployeeIdAndTargetMonth(employeeId, normalizedMonth)) {
            throw new BusinessException(ErrorCode.PAYROLL_ALREADY_EXISTS);
        }

        // 3. 직원 & 매장 정보 조회
        StoreEmployee employee = storeEmployeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));
        Store store = employee.getStore();
        int hourlyWage = employee.getHourlyWage();

        // 4. 해당 월 출퇴근 기록 조회 (clockIn, clockOut 모두 존재하는 것만)
        LocalDate endDate = normalizedMonth.plusMonths(1).minusDays(1);
        List<Attendance> attendances = attendanceRepository
                .findAllByEmployeeIdAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                        employeeId, normalizedMonth, endDate);

        if (attendances.isEmpty()) {
            log.warn("출퇴근 기록 없음 - 0원 급여 생성. employeeId: {}, targetMonth: {}",
                    employeeId, normalizedMonth);
        }

        // 5. 주휴수당·연장수당 계산용 확장 범위 조회 (월 경계 주차 보정)
        //    해당 월 1일이 속한 주의 월요일 ~ 말일이 속한 주의 일요일
        WeekFields weekFields = WeekFields.ISO;
        LocalDate extendedStart = normalizedMonth.with(weekFields.dayOfWeek(), 1);
        LocalDate extendedEnd = endDate.with(weekFields.dayOfWeek(), 7);

        List<Attendance> extendedAttendances = attendanceRepository
                .findAllByEmployeeIdAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                        employeeId, extendedStart, extendedEnd);

        // 6. 각 항목 계산
        int totalWorkMinutes = calculationService.calculateTotalWorkMinutes(attendances);
        int nightWorkMinutes = calculationService.calculateNightWorkMinutes(attendances);

        long basicPay = calculationService.calculateBasicPay(totalWorkMinutes, hourlyWage);

        // 주휴수당은 확장 범위 데이터 + targetMonth로 월 경계 보정
        long weeklyHolidayPay = calculationService.calculateWeeklyHolidayPay(
                extendedAttendances, hourlyWage, normalizedMonth);

        // 연장수당도 확장 범위 데이터 + targetMonth로 월 경계 보정
        long overtimePay = calculationService.calculateOvertimePay(
                extendedAttendances, hourlyWage,
                store.getIsOver5Employees(),
                employee.getIncludeHolidayPay(),
                normalizedMonth);

        // 야간 가산수당: 5인 미만 사업장이고 지급 옵션이 꺼져 있으면 면제
        long nightPay = (store.getIsOver5Employees() || employee.getIncludeHolidayPay())
                ? calculationService.calculateNightPay(nightWorkMinutes, hourlyWage)
                : 0L;

        long totalAllowance = weeklyHolidayPay + overtimePay + nightPay;
        long grossPay = basicPay + totalAllowance;

        long totalDeduction = calculationService.calculateDeduction(grossPay, employee.getTaxType());
        long netPay = grossPay - totalDeduction;

        // 7. Payroll 저장
        Payroll payroll = Payroll.builder()
                .employee(employee)
                .targetMonth(normalizedMonth)
                .totalWorkMinutes(totalWorkMinutes)
                .nightWorkMinutes(nightWorkMinutes)
                .basicPay(basicPay)
                .totalAllowance(totalAllowance)
                .totalDeduction(totalDeduction)
                .netPay(netPay)
                .build();

        // 동시성 중복 방어: DB unique 제약(uq_payrolls_employee_month)에 의한 race condition 처리
        try {
            payrollRepository.save(payroll);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.PAYROLL_ALREADY_EXISTS);
        }

        // 8. PayrollDetail 항목별 저장
        List<PayrollDetail> details = new ArrayList<>();

        // 기본급
        details.add(PayrollDetail.builder()
                .payroll(payroll)
                .detailType(PayrollDetailType.BASE)
                .itemName("기본급")
                .amount(basicPay)
                .calculationFormula(totalWorkMinutes + "분 × " + hourlyWage + "원 ÷ 60")
                .workMinutes(totalWorkMinutes)
                .build());

        // 주휴수당 (0원이 아닐 때만)
        if (weeklyHolidayPay > 0) {
            details.add(PayrollDetail.builder()
                    .payroll(payroll)
                    .detailType(PayrollDetailType.ALLOWANCE)
                    .itemName("주휴수당")
                    .amount(weeklyHolidayPay)
                    .calculationFormula("주 15h 이상 근무 주 대상 × (주근무분 × " + hourlyWage + "원 × 8) ÷ (40 × 60)")
                    .build());
        }

        // 연장수당
        if (overtimePay > 0) {
            details.add(PayrollDetail.builder()
                    .payroll(payroll)
                    .detailType(PayrollDetailType.ALLOWANCE)
                    .itemName("연장근로수당")
                    .amount(overtimePay)
                    .calculationFormula("일 8h/주 40h 초과분 × " + hourlyWage + "원 ÷ 60 ÷ 2")
                    .build());
        }

        // 야간수당
        if (nightPay > 0) {
            details.add(PayrollDetail.builder()
                    .payroll(payroll)
                    .detailType(PayrollDetailType.ALLOWANCE)
                    .itemName("야간근로수당")
                    .amount(nightPay)
                    .calculationFormula(nightWorkMinutes + "분 × " + hourlyWage + "원 ÷ 60 ÷ 2")
                    .workMinutes(nightWorkMinutes)
                    .build());
        }

        // 세금 공제 항목
        Map<String, Long> deductionDetails = calculationService
                .calculateDeductionDetails(grossPay, employee.getTaxType());
        for (Map.Entry<String, Long> entry : deductionDetails.entrySet()) {
            details.add(PayrollDetail.builder()
                    .payroll(payroll)
                    .detailType(PayrollDetailType.DEDUCTION)
                    .itemName(entry.getKey())
                    .amount(entry.getValue())
                    .calculationFormula("총 지급액 " + grossPay + "원 기준")
                    .build());
        }

        payrollDetailRepository.saveAll(details);

        log.info("급여 생성 완료 - employeeId: {}, targetMonth: {}, netPay: {}",
                employeeId, normalizedMonth, netPay);

        return payroll;
    }

    // ─── Private Methods ───

    /**
     * 매장 소유권을 검증합니다.
     */
    private void validateStoreOwnership(Long userId, Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if (!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.PAYROLL_STORE_NOT_OWNED);
        }
    }

    // ─── Result Records ───

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
