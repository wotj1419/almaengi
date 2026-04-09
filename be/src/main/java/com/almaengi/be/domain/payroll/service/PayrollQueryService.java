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
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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

        // 승인
        if (employee.getStatus() != StoreEmployeeStatus.WORKING)
            throw new BusinessException(ErrorCode.INVALID_EMPLOYEE_STATUS);

        LocalDate normalizedMonth = targetMonth.withDayOfMonth(1);

        // 급여가 이미 생성되었으면 저장된 데이터 반환
        Optional<Payroll> existingPayroll = payrollRepository
                .findByEmployeeIdAndTargetMonth(employee.getId(), normalizedMonth);

        Integer payDay = employee.getStore().getPayDay();

        if (existingPayroll.isPresent()) {
            Payroll payroll = existingPayroll.get();
            List<PayrollDetail> details = payrollDetailRepository.findAllByPayrollIdOrdered(payroll.getId());
            return PayrollResponseDto.MyPayroll.from(payroll, details, false, payDay);
        }

        // 급여 미생성: 출퇴근 기록 기반 실시간 미리보기
        return calculatePreview(employee, normalizedMonth, payDay);
    }

    /**
     * API 2: 사장님 매장 급여 목록 조회 (FR-PY-005)
     * 해당 월 전 직원의 급여 요약을 한눈에 확인합니다.
     * 연장근무시간은 Attendance 기록에서 동적으로 계산합니다.
     */
    public PayrollResponseDto.StorePayrollSummary getStorePayrolls(Long userId, Long storeId, LocalDate targetMonth) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
        if (!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.PAYROLL_STORE_NOT_OWNED);
        }

        LocalDate normalizedMonth = targetMonth.withDayOfMonth(1);
        LocalDate endDate = normalizedMonth.plusMonths(1).minusDays(1);
        String targetMonthStr = normalizedMonth.toString().substring(0, 7);

        // fetch-join으로 Payroll + StoreEmployee + User를 한 번에 조회 (N+1 방지)
        List<Payroll> payrolls = payrollRepository
                .findAllByStoreIdAndTargetMonthWithEmployee(storeId, normalizedMonth);

        // 연장근무시간 동적 계산: 직원별 Attendance를 배치 조회 후 계산
        Map<Long, Integer> overtimeMinutesMap = calculateOvertimeMinutesForPayrolls(
                payrolls, store, normalizedMonth, endDate);

        return PayrollResponseDto.StorePayrollSummary.from(payrolls, targetMonthStr, overtimeMinutesMap);
    }

    /**
     * 급여 목록의 직원들에 대해 연장근무시간(분)을 배치 계산합니다.
     * 주차 경계 보정을 위해 확장 범위(ISO 주 시작~끝)의 Attendance를 조회합니다.
     *
     * @param payrolls        급여 목록
     * @param store           매장 엔티티 (5인 이상 여부 참조)
     * @param normalizedMonth 정산 대상 월 1일
     * @param endDate         정산 대상 월 말일
     * @return 직원 ID → 연장근무시간(분) 매핑
     */
    private Map<Long, Integer> calculateOvertimeMinutesForPayrolls(
            List<Payroll> payrolls, Store store, LocalDate normalizedMonth, LocalDate endDate) {

        List<Long> employeeIds = payrolls.stream()
                .map(p -> p.getEmployee().getId())
                .toList();

        if (employeeIds.isEmpty()) {
            return Map.of();
        }

        // 주차 경계 보정: ISO 주의 월요일~일요일까지 확장 범위 조회
        WeekFields weekFields = WeekFields.ISO;
        LocalDate extendedStart = normalizedMonth.with(weekFields.dayOfWeek(), 1);
        LocalDate extendedEnd = endDate.with(weekFields.dayOfWeek(), 7);

        List<Attendance> allAttendances = attendanceRepository
                .findAllByEmployeeIdInAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                        employeeIds, extendedStart, extendedEnd);

        // 직원별로 그룹핑
        Map<Long, List<Attendance>> attendanceByEmployee = allAttendances.stream()
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

        // 직원별 연장근무시간 계산
        Map<Long, Integer> overtimeMinutesMap = new HashMap<>();
        for (Payroll payroll : payrolls) {
            Long empId = payroll.getEmployee().getId();
            List<Attendance> empAttendances = attendanceByEmployee.getOrDefault(empId, List.of());

            int overtimeMinutes = calculationService.calculateOvertimeMinutes(
                    empAttendances,
                    store.getIsOver5Employees(),
                    payroll.getEmployee().getIncludeHolidayPay(),
                    normalizedMonth);

            overtimeMinutesMap.put(empId, overtimeMinutes);
        }

        return overtimeMinutesMap;
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
     * API 6: 급여 지출 요약 (전월 대비 증감률 + 수당 비교 + 직원 리스트 + 최고급여자)
     *
     * 진행 중인 월(현재 월)이면 Attendance 기반으로 부분 기간 비교를 수행하고,
     * 완료된 월이면 Payroll/PayrollDetail 레코드를 사용합니다.
     *
     * 부분 기간 비교 예시 (오늘=3/30, targetMonth=3월):
     *   이번 달: 3/1 ~ 3/29(어제)
     *   이전 달: 2/1 ~ min(29, 2월 말일=28) = 2/1 ~ 2/28
     */
    public PayrollResponseDto.MonthlySummary getMonthlySummary(Long userId, Long storeId, LocalDate targetMonth) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
        if (!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.PAYROLL_STORE_NOT_OWNED);
        }

        LocalDate normalizedMonth = targetMonth.withDayOfMonth(1);
        LocalDate lastMonth = normalizedMonth.minusMonths(1);
        LocalDate today = LocalDate.now();

        // 진행 중인 월인지 판별 (targetMonth의 연월이 오늘과 같으면 진행 중)
        boolean isPartialMonth = normalizedMonth.getYear() == today.getYear()
                && normalizedMonth.getMonth() == today.getMonth();

        if (isPartialMonth) {
            return buildPartialMonthSummary(store, storeId, normalizedMonth, lastMonth, today);
        } else {
            return buildCompleteMonthSummary(store, storeId, normalizedMonth, lastMonth);
        }
    }

    // ─── 완료된 월 요약: Payroll/PayrollDetail 기반 (가벼움) ───

    /**
     * 완료된 월끼리 비교합니다.
     * Payroll 레코드에서 총액·직원 리스트를, PayrollDetail에서 수당 합계를 조회합니다.
     */
    private PayrollResponseDto.MonthlySummary buildCompleteMonthSummary(
            Store store, Long storeId, LocalDate thisMonth, LocalDate lastMonth) {

        LocalDate thisEnd = thisMonth.plusMonths(1).minusDays(1);  // 이번 달 말일
        LocalDate lastEnd = lastMonth.plusMonths(1).minusDays(1);  // 이전 달 말일

        // Payroll에서 총액 + 직원 정보 조회
        List<Payroll> thisPayrolls = payrollRepository
                .findAllByStoreIdAndTargetMonthWithEmployee(storeId, thisMonth);
        List<Payroll> lastPayrolls = payrollRepository
                .findAllByEmployeeStoreIdAndTargetMonth(storeId, lastMonth);

        long thisTotal = thisPayrolls.stream().mapToLong(Payroll::getNetPay).sum();
        long lastTotal = lastPayrolls.stream().mapToLong(Payroll::getNetPay).sum();
        long thisBasicPay = thisPayrolls.stream().mapToLong(Payroll::getBasicPay).sum();
        long lastBasicPay = lastPayrolls.stream().mapToLong(Payroll::getBasicPay).sum();

        // PayrollDetail에서 수당 항목별 합계 조회
        AllowanceSums thisAllowances = sumAllowances(
                payrollDetailRepository.findAllowancesByStoreIdAndTargetMonth(storeId, thisMonth));
        AllowanceSums lastAllowances = sumAllowances(
                payrollDetailRepository.findAllowancesByStoreIdAndTargetMonth(storeId, lastMonth));

        // 이전 달 급여 이체 완료 여부
        boolean isAllTransferred = !lastPayrolls.isEmpty()
                && lastPayrolls.stream().allMatch(Payroll::getIsTransferred);

        // 직원 리스트 (netPay 내림차순)
        List<PayrollResponseDto.SummaryEmployee> employees = buildEmployeeList(thisPayrolls);
        List<PayrollResponseDto.SummaryEmployee> topEarners = extractTopEarners(employees);

        return buildMonthlySummaryResponse(
                store.getPayDay(), isAllTransferred,
                thisMonth, false,
                thisMonth, thisEnd, lastMonth, lastEnd,
                thisTotal, lastTotal,
                thisBasicPay, lastBasicPay,
                thisAllowances, lastAllowances,
                employees, topEarners);
    }

    // ─── 진행 중인 월 요약: Attendance 기반 재계산 (무거움) ───

    /**
     * 진행 중인 월의 부분 기간 비교를 수행합니다.
     * 어제까지의 Attendance 기록으로 두 달 모두 급여를 재계산합니다.
     */
    private PayrollResponseDto.MonthlySummary buildPartialMonthSummary(
            Store store, Long storeId, LocalDate thisMonth, LocalDate lastMonth, LocalDate today) {

        // 비교 기간 계산: 이번 달 1일 ~ 어제
        LocalDate thisStart = thisMonth;
        LocalDate thisEnd = today.minusDays(1);

        // 이전 달 끝: min(어제 일자, 이전 달 말일)
        int lastMonthLastDay = lastMonth.plusMonths(1).minusDays(1).getDayOfMonth();
        LocalDate lastStart = lastMonth;
        LocalDate lastEnd = lastMonth.withDayOfMonth(Math.min(thisEnd.getDayOfMonth(), lastMonthLastDay));

        // 이전 달 급여 이체 완료 여부
        List<Payroll> lastPayrolls = payrollRepository
                .findAllByEmployeeStoreIdAndTargetMonth(storeId, lastMonth);
        boolean isAllTransferred = !lastPayrolls.isEmpty()
                && lastPayrolls.stream().allMatch(Payroll::getIsTransferred);

        // 매장 활성 직원 조회
        List<StoreEmployee> activeEmployees = storeEmployeeRepository
                .findAllByStoreIdAndStatus(storeId, StoreEmployeeStatus.WORKING);

        if (activeEmployees.isEmpty()) {
            return buildMonthlySummaryResponse(
                    store.getPayDay(), isAllTransferred,
                    thisMonth, true,
                    thisStart, thisEnd, lastStart, lastEnd,
                    0L, 0L,
                    0L, 0L,
                    AllowanceSums.ZERO, AllowanceSums.ZERO,
                    List.of(), List.of());
        }

        List<Long> employeeIds = activeEmployees.stream().map(StoreEmployee::getId).toList();

        // 두 달의 Attendance를 배치 조회 (확장 범위: 주차 경계 보정)
        WeekFields weekFields = WeekFields.ISO;

        // 이번 달 Attendance (확장 범위 시작 ~ 어제)
        LocalDate thisExtStart = thisStart.with(weekFields.dayOfWeek(), 1);
        List<Attendance> thisAllAttendances = attendanceRepository
                .findAllByEmployeeIdInAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                        employeeIds, thisExtStart, thisEnd);

        // 이전 달 Attendance (확장 범위 시작 ~ 이전 달 비교 종료일)
        LocalDate lastExtStart = lastStart.with(weekFields.dayOfWeek(), 1);
        List<Attendance> lastAllAttendances = attendanceRepository
                .findAllByEmployeeIdInAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                        employeeIds, lastExtStart, lastEnd);

        // 직원별로 그룹핑
        Map<Long, List<Attendance>> thisAttByEmp = thisAllAttendances.stream()
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));
        Map<Long, List<Attendance>> lastAttByEmp = lastAllAttendances.stream()
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

        // 직원별 급여 재계산 → 합계 집계
        long thisTotal = 0;
        long lastTotal = 0;
        long thisBasicPay = 0;
        long lastBasicPay = 0;
        AllowanceSums thisAllowances = new AllowanceSums();
        AllowanceSums lastAllowances = new AllowanceSums();
        List<PayrollResponseDto.SummaryEmployee> employees = new ArrayList<>();

        for (StoreEmployee emp : activeEmployees) {
            Long empId = emp.getId();
            int hourlyWage = emp.getHourlyWage();
            boolean isOver5 = store.getIsOver5Employees();
            boolean includeHolidayPay = emp.getIncludeHolidayPay();

            // 이번 달 급여 계산
            List<Attendance> thisEmpAtt = thisAttByEmp.getOrDefault(empId, List.of());
            EmployeePayCalc thisCalc = calculateEmployeePay(thisEmpAtt, hourlyWage, isOver5, includeHolidayPay, emp.getTaxType(), thisMonth);
            thisTotal += thisCalc.netPay;
            thisBasicPay += thisCalc.basicPay;
            thisAllowances.add(thisCalc);

            // 이전 달 급여 계산
            List<Attendance> lastEmpAtt = lastAttByEmp.getOrDefault(empId, List.of());
            EmployeePayCalc lastCalc = calculateEmployeePay(lastEmpAtt, hourlyWage, isOver5, includeHolidayPay, emp.getTaxType(), lastMonth);
            lastTotal += lastCalc.netPay;
            lastBasicPay += lastCalc.basicPay;
            lastAllowances.add(lastCalc);

            // 직원 리스트에는 이번 달 netPay 기준
            employees.add(PayrollResponseDto.SummaryEmployee.builder()
                    .employeeId(empId)
                    .employeeName(emp.getUser().getName())
                    .netPay(thisCalc.netPay)
                    .build());
        }

        // netPay 내림차순 정렬
        employees.sort((a, b) -> Long.compare(b.getNetPay(), a.getNetPay()));
        List<PayrollResponseDto.SummaryEmployee> topEarners = extractTopEarners(employees);

        return buildMonthlySummaryResponse(
                store.getPayDay(), isAllTransferred,
                thisMonth, true,
                thisStart, thisEnd, lastStart, lastEnd,
                thisTotal, lastTotal,
                thisBasicPay, lastBasicPay,
                thisAllowances, lastAllowances,
                employees, topEarners);
    }

    /**
     * 직원 한 명의 Attendance 기록에서 급여를 재계산합니다.
     * PayrollCalculationService의 계산 파이프라인을 재사용합니다.
     *
     * @param attendances      해당 직원의 (확장 범위 포함) 출퇴근 기록
     * @param hourlyWage       시급
     * @param isOver5          5인 이상 사업장 여부
     * @param includeHolidayPay 5인 미만 가산수당 지급 여부
     * @param taxType          직원의 세금 유형
     * @param targetMonth      정산 대상 월
     * @return 계산 결과 (netPay, weeklyHolidayPay, overtimePay, nightPay)
     */
    private EmployeePayCalc calculateEmployeePay(List<Attendance> attendances, int hourlyWage,
                                                  boolean isOver5, boolean includeHolidayPay,
                                                  TaxType taxType, LocalDate targetMonth) {
        // 해당 월 범위 내 Attendance만 필터 (총 근무시간·야간시간 계산용)
        LocalDate monthEnd = targetMonth.plusMonths(1).minusDays(1);
        List<Attendance> monthAttendances = attendances.stream()
                .filter(a -> !a.getTargetDate().isBefore(targetMonth) && !a.getTargetDate().isAfter(monthEnd))
                .toList();

        int totalWorkMinutes = calculationService.calculateTotalWorkMinutes(monthAttendances);
        int nightWorkMinutes = calculationService.calculateNightWorkMinutes(monthAttendances);

        long basicPay = calculationService.calculateBasicPay(totalWorkMinutes, hourlyWage);

        // 주휴수당·연장수당은 확장 범위(주차 경계 포함) 데이터 사용
        long weeklyHolidayPay = calculationService.calculateWeeklyHolidayPay(
                attendances, hourlyWage, targetMonth);
        long overtimePay = calculationService.calculateOvertimePay(
                attendances, hourlyWage, isOver5, includeHolidayPay, targetMonth);
        long nightPay = (isOver5 || includeHolidayPay)
                ? calculationService.calculateNightPay(nightWorkMinutes, hourlyWage)
                : 0L;

        long totalAllowance = weeklyHolidayPay + overtimePay + nightPay;
        long grossPay = basicPay + totalAllowance;
        // 부분 기간이므로 세금 공제도 비례 적용 (동일 기준 비교를 위해 기존 로직 재사용)
        long totalDeduction = calculationService.calculateDeduction(grossPay, taxType);
        long netPay = grossPay - totalDeduction;

        return new EmployeePayCalc(netPay, basicPay, weeklyHolidayPay, overtimePay, nightPay);
    }

    // ─── Private Helpers (급여 요약) ───

    /**
     * 직원별 급여 계산 결과를 담는 내부 레코드입니다.
     */
    private record EmployeePayCalc(long netPay, long basicPay, long weeklyHolidayPay, long overtimePay, long nightPay) {}

    /**
     * 수당 합계를 누적하는 내부 클래스입니다.
     */
    private static class AllowanceSums {
        static final AllowanceSums ZERO = new AllowanceSums();
        long weeklyHolidayPay = 0;
        long overtimePay = 0;
        long nightPay = 0;

        void add(EmployeePayCalc calc) {
            weeklyHolidayPay += calc.weeklyHolidayPay;
            overtimePay += calc.overtimePay;
            nightPay += calc.nightPay;
        }
    }

    /**
     * PayrollDetail 수당 항목 리스트에서 항목명별로 합계를 구합니다.
     * 완료된 월에서 Payroll 레코드 기반으로 수당을 조회할 때 사용합니다.
     */
    private AllowanceSums sumAllowances(List<PayrollDetail> details) {
        AllowanceSums sums = new AllowanceSums();
        for (PayrollDetail d : details) {
            switch (d.getItemName()) {
                case "주휴수당" -> sums.weeklyHolidayPay += d.getAmount();
                case "연장근로수당" -> sums.overtimePay += d.getAmount();
                case "야간근로수당" -> sums.nightPay += d.getAmount();
            }
        }
        return sums;
    }

    /**
     * Payroll 리스트에서 직원별 SummaryEmployee를 생성하고 netPay 내림차순으로 정렬합니다.
     */
    private List<PayrollResponseDto.SummaryEmployee> buildEmployeeList(List<Payroll> payrolls) {
        return payrolls.stream()
                .map(p -> PayrollResponseDto.SummaryEmployee.builder()
                        .employeeId(p.getEmployee().getId())
                        .employeeName(p.getEmployee().getUser().getName())
                        .netPay(p.getNetPay())
                        .build())
                .sorted((a, b) -> Long.compare(b.getNetPay(), a.getNetPay()))
                .toList();
    }

    /**
     * 직원 리스트에서 최고 급여자를 추출합니다.
     * netPay가 동일한 직원이 여럿이면 모두 포함합니다.
     * 리스트가 비어있으면 빈 리스트를 반환합니다.
     */
    private List<PayrollResponseDto.SummaryEmployee> extractTopEarners(
            List<PayrollResponseDto.SummaryEmployee> sortedEmployees) {
        if (sortedEmployees.isEmpty()) {
            return List.of();
        }
        long maxNetPay = sortedEmployees.get(0).getNetPay();
        return sortedEmployees.stream()
                .filter(e -> e.getNetPay() == maxNetPay)
                .toList();
    }

    /**
     * 증감률을 계산하고 MonthlySummary 응답을 빌드합니다.
     * 완료된 월과 진행 중인 월 모두 이 메서드로 최종 응답을 생성합니다.
     */
    private PayrollResponseDto.MonthlySummary buildMonthlySummaryResponse(
            Integer payDay, boolean isAllTransferred,
            LocalDate targetMonth, boolean isPartialMonth,
            LocalDate thisStart, LocalDate thisEnd,
            LocalDate lastStart, LocalDate lastEnd,
            long thisTotal, long lastTotal,
            long thisBasicPay, long lastBasicPay,
            AllowanceSums thisAllowances, AllowanceSums lastAllowances,
            List<PayrollResponseDto.SummaryEmployee> employees,
            List<PayrollResponseDto.SummaryEmployee> topEarners) {

        // 증감률 계산
        Double changeRate = null;
        String changeDirection = "UNCHANGED";

        if (lastTotal > 0) {
            double rate = (double) (thisTotal - lastTotal) / lastTotal * 100;
            changeRate = Math.round(rate * 10) / 10.0;

            if (changeRate > 0) {
                changeDirection = "UP";
            } else if (changeRate < 0) {
                changeDirection = "DOWN";
            }
        }

        return PayrollResponseDto.MonthlySummary.builder()
                .payDay(payDay)
                .isAllTransferred(isAllTransferred)
                .targetMonth(targetMonth.toString().substring(0, 7))
                .isPartialMonth(isPartialMonth)
                .thisMonthStart(thisStart)
                .thisMonthEnd(thisEnd)
                .lastMonthStart(lastStart)
                .lastMonthEnd(lastEnd)
                .thisMonthTotal(thisTotal)
                .lastMonthTotal(lastTotal)
                .changeRate(changeRate)
                .changeDirection(changeDirection)
                .thisMonthBasicPay(thisBasicPay)
                .lastMonthBasicPay(lastBasicPay)
                .thisMonthWeeklyHolidayPay(thisAllowances.weeklyHolidayPay)
                .lastMonthWeeklyHolidayPay(lastAllowances.weeklyHolidayPay)
                .thisMonthOvertimePay(thisAllowances.overtimePay)
                .lastMonthOvertimePay(lastAllowances.overtimePay)
                .thisMonthNightPay(thisAllowances.nightPay)
                .lastMonthNightPay(lastAllowances.nightPay)
                .employeeCount(employees.size())
                .employees(employees)
                .topEarners(topEarners)
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
    private PayrollResponseDto.MyPayroll calculatePreview(StoreEmployee employee, LocalDate normalizedMonth, Integer payDay) {
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
                .payDay(payDay)
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
                .isTransferred(false)
                .transferredAt(null)
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
