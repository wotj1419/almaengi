package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
import com.almaengi.be.domain.payroll.dto.PayrollResponseDto;
import com.almaengi.be.domain.payroll.dto.PayrollResponseDto.DetailItem;
import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.entity.PayrollDetail;
import com.almaengi.be.domain.payroll.repository.PayrollDetailRepository;
import com.almaengi.be.domain.payroll.repository.PayrollRepository;
import com.almaengi.be.domain.payroll.type.PayrollDetailType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 급여 조회 전용 서비스입니다.
 * 대시보드 API(알바생 예상 급여, 사장님 급여 목록, 상세 조회, 승인)를 담당합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class  PayrollQueryService {

    private final PayrollRepository payrollRepository;
    private final PayrollDetailRepository payrollDetailRepository;
    private final StoreRepository storeRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final PayrollCalculationService calculationService;

    /**
     * API 1: 알바생 내 급여 조회 (FR-PY-004)
     * 급여가 이미 생성된 경우 저장된 데이터를 반환하고,
     * 미생성 시 출퇴근 기록을 기반으로 실시간 추정값을 계산합니다.
     */
    public PayrollResponseDto.MyPayroll getMyPayroll(Long userId, Long storeId, LocalDate targetMonth) {
        StoreEmployee employee = storeEmployeeRepository.findByStoreIdAndUserId(storeId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));

        LocalDate normalizedMonth = targetMonth.withDayOfMonth(1);

        // 급여가 이미 생성되었으면 저장된 데이터 반환
        Optional<Payroll> existingPayroll = payrollRepository
                .findByEmployeeIdAndTargetMonth(employee.getId(), normalizedMonth);

        if (existingPayroll.isPresent()) {
            Payroll payroll = existingPayroll.get();
            List<PayrollDetail> details = payrollDetailRepository.findAllByPayrollIdOrdered(payroll.getId());
            return PayrollResponseDto.MyPayroll.from(payroll, details, false);
        }

        // 급여 미생성: 출퇴근 기록 기반 실시간 미리보기
        return calculatePreview(employee, normalizedMonth);
    }

    /**
     * API 2: 사장님 매장 급여 목록 조회 (FR-PY-005)
     * 해당 월 전 직원의 급여 요약을 한눈에 확인합니다.
     */
    public PayrollResponseDto.StorePayrollSummary getStorePayrolls(Long userId, Long storeId, LocalDate targetMonth) {
        validateStoreOwnership(userId, storeId);

        LocalDate normalizedMonth = targetMonth.withDayOfMonth(1);
        String targetMonthStr = normalizedMonth.toString().substring(0, 7);

        // fetch-join으로 Payroll + StoreEmployee + User를 한 번에 조회 (N+1 방지)
        List<Payroll> payrolls = payrollRepository
                .findAllByStoreIdAndTargetMonthWithEmployee(storeId, normalizedMonth);

        return PayrollResponseDto.StorePayrollSummary.from(payrolls, targetMonthStr);
    }

    /**
     * API 3: 급여 상세 조회
     * 사장님 또는 해당 직원 본인만 조회할 수 있습니다.
     */
    public PayrollResponseDto.PayrollDetailView getPayrollDetail(Long userId, Long storeId, Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYROLL_NOT_FOUND));

        // 권한 검증: 매장 소유자이거나 해당 직원 본인이어야 함
        validatePayrollAccess(userId, storeId, payroll);

        List<PayrollDetail> details = payrollDetailRepository.findAllByPayrollIdOrdered(payrollId);
        return PayrollResponseDto.PayrollDetailView.from(payroll, details);
    }

    /**
     * API 4: 급여 승인
     * 사장님만 급여를 최종 승인할 수 있습니다.
     */
    @Transactional
    public void approvePayroll(Long userId, Long storeId, Long payrollId) {
        validateStoreOwnership(userId, storeId);

        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYROLL_NOT_FOUND));

        // 해당 매장의 급여인지 확인
        if (!payroll.getEmployee().getStore().getId().equals(storeId)) {
            throw new BusinessException(ErrorCode.PAYROLL_ACCESS_DENIED);
        }

        payroll.approve();

        log.info("급여 승인 완료 - payrollId: {}, approvedBy: {}", payrollId, userId);
    }

    /**
     * API 6: 급여 지출 요약 (전월 대비 증감률)
     * 사장님 홈 대시보드에서 이번 달 총 급여 지출과 지난 달 대비 증감률을 확인합니다.
     */
    public PayrollResponseDto.MonthlySummary getMonthlySummary(Long userId, Long storeId, LocalDate targetMonth) {
        validateStoreOwnership(userId, storeId);

        LocalDate normalizedMonth = targetMonth.withDayOfMonth(1);
        LocalDate lastMonth = normalizedMonth.minusMonths(1);

        // 이번 달, 지난 달 급여를 각각 조회
        List<Payroll> thisMonthPayrolls = payrollRepository
                .findAllByEmployeeStoreIdAndTargetMonth(storeId, normalizedMonth);
        List<Payroll> lastMonthPayrolls = payrollRepository
                .findAllByEmployeeStoreIdAndTargetMonth(storeId, lastMonth);

        long thisMonthTotal = thisMonthPayrolls.stream().mapToLong(Payroll::getNetPay).sum();
        long lastMonthTotal = lastMonthPayrolls.stream().mapToLong(Payroll::getNetPay).sum();

        // 증감률 계산
        Double changeRate = null;
        String changeDirection = "UNCHANGED";

        if (lastMonthTotal > 0) {
            double rate = (double) (thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100;
            changeRate = Math.round(rate * 10) / 10.0;  // 소수점 첫째 자리 반올림

            if (changeRate > 0) {
                changeDirection = "UP";
            } else if (changeRate < 0) {
                changeDirection = "DOWN";
            }
        }

        return PayrollResponseDto.MonthlySummary.builder()
                .targetMonth(normalizedMonth.toString().substring(0, 7))
                .thisMonthTotal(thisMonthTotal)
                .lastMonthTotal(lastMonthTotal)
                .changeRate(changeRate)
                .changeDirection(changeDirection)
                .employeeCount(thisMonthPayrolls.size())
                .build();
    }

    /**
     * 매장 단위 급여 일괄 승인
     * 해당 매장+월의 미승인 급여를 전체 승인합니다.
     */
    @Transactional
    public int approveAllPayrolls(Long userId, Long storeId, LocalDate targetMonth) {
        validateStoreOwnership(userId, storeId);

        LocalDate normalizedMonth = targetMonth.withDayOfMonth(1);
        List<Payroll> payrolls = payrollRepository
                .findAllByEmployeeStoreIdAndTargetMonth(storeId, normalizedMonth);

        int approvedCount = 0;
        for (Payroll payroll : payrolls) {
            if (!payroll.getIsApproved()) {
                payroll.approve();
                approvedCount++;
            }
        }

        log.info("매장 단위 급여 일괄 승인 완료 - storeId: {}, targetMonth: {}, approvedCount: {}",
                storeId, normalizedMonth, approvedCount);
        return approvedCount;
    }

    // ─── Private Methods ───

    /**
     * 실시간 급여 미리보기 (DB 저장 없이 계산만 수행)
     * PayrollService의 계산 파이프라인을 재사용하되, 엔티티 대신 DTO를 빌드합니다.
     */
    private PayrollResponseDto.MyPayroll calculatePreview(StoreEmployee employee, LocalDate normalizedMonth) {
        Store store = employee.getStore();
        int hourlyWage = employee.getHourlyWage();

        // 해당 월 출퇴근 기록 조회
        LocalDate endDate = normalizedMonth.plusMonths(1).minusDays(1);
        List<Attendance> attendances = attendanceRepository
                .findAllByEmployeeIdAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                        employee.getId(), normalizedMonth, endDate);

        // 주휴수당·연장수당 계산용 확장 범위 조회 (월 경계 주차 보정)
        WeekFields weekFields = WeekFields.ISO;
        LocalDate extendedStart = normalizedMonth.with(weekFields.dayOfWeek(), 1);
        LocalDate extendedEnd = endDate.with(weekFields.dayOfWeek(), 7);

        List<Attendance> extendedAttendances = attendanceRepository
                .findAllByEmployeeIdAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                        employee.getId(), extendedStart, extendedEnd);

        // 각 항목 계산 (PayrollCalculationService 재사용)
        int totalWorkMinutes = calculationService.calculateTotalWorkMinutes(attendances);
        int nightWorkMinutes = calculationService.calculateNightWorkMinutes(attendances);

        long basicPay = calculationService.calculateBasicPay(totalWorkMinutes, hourlyWage);
        long weeklyHolidayPay = calculationService.calculateWeeklyHolidayPay(
                extendedAttendances, hourlyWage, normalizedMonth);
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

        // 미리보기용 DetailItem 목록 구성
        List<DetailItem> details = new ArrayList<>();

        details.add(DetailItem.builder()
                .detailType(PayrollDetailType.BASE.name())
                .itemName("기본급")
                .amount(basicPay)
                .calculationFormula(totalWorkMinutes + "분 × " + hourlyWage + "원 ÷ 60")
                .workMinutes(totalWorkMinutes)
                .build());

        if (weeklyHolidayPay > 0) {
            details.add(DetailItem.builder()
                    .detailType(PayrollDetailType.ALLOWANCE.name())
                    .itemName("주휴수당")
                    .amount(weeklyHolidayPay)
                    .calculationFormula("주 15h 이상 근무 주 대상")
                    .build());
        }

        if (overtimePay > 0) {
            details.add(DetailItem.builder()
                    .detailType(PayrollDetailType.ALLOWANCE.name())
                    .itemName("연장근로수당")
                    .amount(overtimePay)
                    .calculationFormula("일 8h/주 40h 초과분 × " + hourlyWage + "원 ÷ 60 ÷ 2")
                    .build());
        }

        if (nightPay > 0) {
            details.add(DetailItem.builder()
                    .detailType(PayrollDetailType.ALLOWANCE.name())
                    .itemName("야간근로수당")
                    .amount(nightPay)
                    .calculationFormula(nightWorkMinutes + "분 × " + hourlyWage + "원 ÷ 60 ÷ 2")
                    .workMinutes(nightWorkMinutes)
                    .build());
        }

        // 공제 항목
        Map<String, Long> deductionDetails = calculationService
                .calculateDeductionDetails(grossPay, employee.getTaxType());
        for (Map.Entry<String, Long> entry : deductionDetails.entrySet()) {
            details.add(DetailItem.builder()
                    .detailType(PayrollDetailType.DEDUCTION.name())
                    .itemName(entry.getKey())
                    .amount(entry.getValue())
                    .calculationFormula("총 지급액 " + grossPay + "원 기준")
                    .build());
        }

        String targetMonthStr = normalizedMonth.toString().substring(0, 7);

        return PayrollResponseDto.MyPayroll.builder()
                .payrollId(null)
                .targetMonth(targetMonthStr)
                .isEstimated(true)
                .isApproved(false)
                .totalWorkMinutes(totalWorkMinutes)
                .nightWorkMinutes(nightWorkMinutes)
                .basicPay(basicPay)
                .totalAllowance(totalAllowance)
                .totalDeduction(totalDeduction)
                .netPay(netPay)
                .details(details)
                .build();
    }

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

    /**
     * 급여 접근 권한을 검증합니다.
     * 매장 소유자이거나 해당 급여의 직원 본인이어야 합니다.
     */
    private void validatePayrollAccess(Long userId, Long storeId, Payroll payroll) {
        // 해당 매장의 급여인지 확인
        if (!payroll.getEmployee().getStore().getId().equals(storeId)) {
            throw new BusinessException(ErrorCode.PAYROLL_ACCESS_DENIED);
        }

        // 매장 소유자인지 확인
        Store store = payroll.getEmployee().getStore();
        if (store.getOwner().getId().equals(userId)) {
            return;
        }

        // 해당 직원 본인인지 확인
        if (payroll.getEmployee().getUser().getId().equals(userId)) {
            return;
        }

        throw new BusinessException(ErrorCode.PAYROLL_ACCESS_DENIED);
    }
}
