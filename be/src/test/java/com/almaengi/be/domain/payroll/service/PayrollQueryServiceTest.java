package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import com.almaengi.be.domain.payroll.dto.PayrollResponseDto;
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
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PayrollQueryServiceTest {

    @InjectMocks
    private PayrollQueryService payrollQueryService;

    @Mock
    private PayrollRepository payrollRepository;
    @Mock
    private PayrollDetailRepository payrollDetailRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    @Mock
    private AttendanceRepository attendanceRepository;
    @Mock
    private PayrollCalculationService calculationService;

    private User owner;
    private User worker;
    private User worker2;
    private Store store;
    private StoreEmployee employee;
    private StoreEmployee employee2;
    private Payroll payroll;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .loginType(LoginType.LOCAL)
                .name("사장님")
                .email("owner@test.com")
                .role(Role.OWNER)
                .build();
        ReflectionTestUtils.setField(owner, "id", 100L);

        worker = User.builder()
                .loginType(LoginType.LOCAL)
                .name("알바생A")
                .email("worker@test.com")
                .role(Role.EMPLOYEE)
                .build();
        ReflectionTestUtils.setField(worker, "id", 200L);

        worker2 = User.builder()
                .loginType(LoginType.LOCAL)
                .name("알바생B")
                .email("worker2@test.com")
                .role(Role.EMPLOYEE)
                .build();
        ReflectionTestUtils.setField(worker2, "id", 201L);

        store = Store.builder()
                .owner(owner)
                .name("테스트매장")
                .address("서울시")
                .isOver5Employees(true)
                .qrCode("test-qr")
                .build();
        ReflectionTestUtils.setField(store, "id", 1L);

        employee = StoreEmployee.builder()
                .store(store)
                .user(worker)
                .hourlyWage(10320)
                .taxType(TaxType.INCOME_3_3)
                .includeHolidayPay(false)
                .build();
        ReflectionTestUtils.setField(employee, "id", 10L);
        ReflectionTestUtils.setField(employee, "status", StoreEmployeeStatus.WORKING);

        employee2 = StoreEmployee.builder()
                .store(store)
                .user(worker2)
                .hourlyWage(12000)
                .taxType(TaxType.INCOME_3_3)
                .includeHolidayPay(false)
                .build();
        ReflectionTestUtils.setField(employee2, "id", 11L);
        ReflectionTestUtils.setField(employee2, "status", StoreEmployeeStatus.WORKING);

        payroll = Payroll.builder()
                .employee(employee)
                .targetMonth(LocalDate.of(2026, 3, 1))
                .totalWorkMinutes(2400)
                .nightWorkMinutes(0)
                .basicPay(412800L)
                .totalAllowance(82560L)
                .totalDeduction(16347L)
                .netPay(479013L)
                .build();
        ReflectionTestUtils.setField(payroll, "id", 1000L);
    }

    // ─── 헬퍼 메서드 ───

    /**
     * 테스트용 Attendance를 생성합니다.
     */
    private Attendance createAttendance(StoreEmployee emp, LocalDate date,
                                         LocalTime start, LocalTime end) {
        Attendance att = Attendance.builder()
                .employee(emp)
                .targetDate(date)
                .scheduledStartTime(start)
                .scheduledEndTime(end)
                .status(AttendanceStatus.WORKING)
                .overtime(false)
                .breakMinutes(0)
                .build();
        ReflectionTestUtils.setField(att, "clockIn", LocalDateTime.of(date, start));
        ReflectionTestUtils.setField(att, "clockOut", LocalDateTime.of(date, end));
        return att;
    }

    /**
     * 테스트용 PayrollDetail(수당)을 생성합니다.
     */
    private PayrollDetail createAllowanceDetail(Payroll payroll, String itemName, long amount) {
        return PayrollDetail.builder()
                .payroll(payroll)
                .detailType(PayrollDetailType.ALLOWANCE)
                .itemName(itemName)
                .amount(amount)
                .build();
    }

    // ═══════════════════════════════════════════════════════
    // 알바생 급여 조회 (getMyPayroll)
    // ═══════════════════════════════════════════════════════

    @Nested
    @DisplayName("알바생 급여 조회 (getMyPayroll)")
    class GetMyPayrollTest {

        @Test
        @DisplayName("성공: 급여 존재 시 저장된 데이터 반환 (isEstimated=false, isTransferred 포함)")
        void success_existingPayroll() {
            // given
            given(storeEmployeeRepository.findByStoreIdAndUserId(1L, 200L))
                    .willReturn(Optional.of(employee));
            given(payrollRepository.findByEmployeeIdAndTargetMonth(10L, LocalDate.of(2026, 3, 1)))
                    .willReturn(Optional.of(payroll));

            PayrollDetail detail = PayrollDetail.builder()
                    .payroll(payroll)
                    .detailType(PayrollDetailType.BASE)
                    .itemName("기본급")
                    .amount(412800L)
                    .calculationFormula("2400분 × 10320원 ÷ 60")
                    .workMinutes(2400)
                    .build();
            given(payrollDetailRepository.findAllByPayrollIdOrdered(1000L))
                    .willReturn(List.of(detail));

            // when
            PayrollResponseDto.MyPayroll result = payrollQueryService.getMyPayroll(200L, 1L, LocalDate.of(2026, 3, 1));

            // then
            assertThat(result.getIsEstimated()).isFalse();
            assertThat(result.getBasicPay()).isEqualTo(412800L);
            assertThat(result.getNetPay()).isEqualTo(479013L);
            assertThat(result.getDetails()).hasSize(1);
            assertThat(result.getIsTransferred()).isFalse();
            assertThat(result.getTransferredAt()).isNull();
        }

        @Test
        @DisplayName("성공: 급여 미존재 시 실시간 미리보기 반환 (isEstimated=true, isTransferred=false)")
        void success_preview() {
            // given
            given(storeEmployeeRepository.findByStoreIdAndUserId(1L, 200L))
                    .willReturn(Optional.of(employee));
            given(payrollRepository.findByEmployeeIdAndTargetMonth(10L, LocalDate.of(2026, 3, 1)))
                    .willReturn(Optional.empty());

            given(attendanceRepository
                    .findAllByEmployeeIdAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                            eq(10L), any(LocalDate.class), any(LocalDate.class)))
                    .willReturn(List.of());

            given(calculationService.calculateTotalWorkMinutes(any())).willReturn(0);
            given(calculationService.calculateNightWorkMinutes(any())).willReturn(0);
            given(calculationService.calculateBasicPay(0, 10320)).willReturn(0L);
            given(calculationService.calculateWeeklyHolidayPay(any(), eq(10320), eq(LocalDate.of(2026, 3, 1))))
                    .willReturn(0L);
            given(calculationService.calculateOvertimePay(any(), eq(10320), eq(true), eq(false), eq(LocalDate.of(2026, 3, 1))))
                    .willReturn(0L);
            given(calculationService.calculateNightPay(0, 10320)).willReturn(0L);
            given(calculationService.calculateDeduction(0L, TaxType.INCOME_3_3)).willReturn(0L);
            given(calculationService.calculateDeductionDetails(0L, TaxType.INCOME_3_3))
                    .willReturn(Map.of());

            // when
            PayrollResponseDto.MyPayroll result = payrollQueryService.getMyPayroll(200L, 1L, LocalDate.of(2026, 3, 1));

            // then
            assertThat(result.getIsEstimated()).isTrue();
            assertThat(result.getPayrollId()).isNull();
            assertThat(result.getIsTransferred()).isFalse();
            assertThat(result.getTransferredAt()).isNull();
        }

        @Test
        @DisplayName("실패: 매장에 소속되지 않은 사용자 → STORE_EMPLOYEE_NOT_FOUND")
        void fail_notEmployee() {
            // given
            given(storeEmployeeRepository.findByStoreIdAndUserId(1L, 999L))
                    .willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> payrollQueryService.getMyPayroll(999L, 1L, LocalDate.of(2026, 3, 1)))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.STORE_EMPLOYEE_NOT_FOUND);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 사장님 매장 급여 목록 조회 (getStorePayrolls)
    // ═══════════════════════════════════════════════════════

    @Nested
    @DisplayName("매장 급여 목록 조회 (getStorePayrolls)")
    class GetStorePayrollsTest {

        @Test
        @DisplayName("성공: 연장근무시간 동적 계산 포함 급여 목록 반환")
        void success_withOvertimeMinutes() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            Payroll payroll1 = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .totalWorkMinutes(2400)
                    .nightWorkMinutes(120)
                    .basicPay(412800L)
                    .totalAllowance(82560L)
                    .totalDeduction(16347L)
                    .netPay(479013L)
                    .build();
            ReflectionTestUtils.setField(payroll1, "id", 1001L);

            Payroll payroll2 = Payroll.builder()
                    .employee(employee2)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .totalWorkMinutes(3000)
                    .nightWorkMinutes(0)
                    .basicPay(600000L)
                    .totalAllowance(50000L)
                    .totalDeduction(21450L)
                    .netPay(628550L)
                    .build();
            ReflectionTestUtils.setField(payroll2, "id", 1002L);

            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployee(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of(payroll1, payroll2));

            // Attendance 배치 조회 mock
            Attendance att1 = createAttendance(employee, LocalDate.of(2026, 2, 10),
                    LocalTime.of(9, 0), LocalTime.of(18, 0));
            Attendance att2 = createAttendance(employee2, LocalDate.of(2026, 2, 10),
                    LocalTime.of(9, 0), LocalTime.of(20, 0));

            given(attendanceRepository
                    .findAllByEmployeeIdInAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                            eq(List.of(10L, 11L)), any(LocalDate.class), any(LocalDate.class)))
                    .willReturn(List.of(att1, att2));

            // 연장근무 계산 mock — 두 직원 모두 동일 matcher이므로 하나로 통합
            given(calculationService.calculateOvertimeMinutes(
                    anyList(), eq(true), eq(false), eq(LocalDate.of(2026, 2, 1))))
                    .willReturn(60);

            // when
            PayrollResponseDto.StorePayrollSummary result =
                    payrollQueryService.getStorePayrolls(100L, 1L, LocalDate.of(2026, 2, 1));

            // then
            assertThat(result.getTargetMonth()).isEqualTo("2026-02");
            assertThat(result.getEmployeeCount()).isEqualTo(2);
            assertThat(result.getTotalLaborCost()).isEqualTo(479013L + 628550L);
            assertThat(result.getTotalWorkMinutes()).isEqualTo(2400 + 3000);
            assertThat(result.getTotalNightWorkMinutes()).isEqualTo(120);
            assertThat(result.getEmployees()).hasSize(2);
        }

        @Test
        @DisplayName("성공: 급여가 없는 월 → 빈 목록 반환")
        void success_emptyPayrolls() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));
            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployee(1L, LocalDate.of(2026, 1, 1)))
                    .willReturn(List.of());

            // when
            PayrollResponseDto.StorePayrollSummary result =
                    payrollQueryService.getStorePayrolls(100L, 1L, LocalDate.of(2026, 1, 1));

            // then
            assertThat(result.getEmployeeCount()).isEqualTo(0);
            assertThat(result.getTotalLaborCost()).isEqualTo(0L);
            assertThat(result.getEmployees()).isEmpty();
        }

        @Test
        @DisplayName("실패: 매장 소유자가 아닌 사용자 → PAYROLL_STORE_NOT_OWNED")
        void fail_notOwner() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            // when & then
            assertThatThrownBy(() -> payrollQueryService.getStorePayrolls(999L, 1L, LocalDate.of(2026, 2, 1)))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAYROLL_STORE_NOT_OWNED);
        }

        @Test
        @DisplayName("성공: 직원별 시급·야간·연장·이체 상태 포함 확인")
        void success_employeeFields() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            Payroll p = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .totalWorkMinutes(2400)
                    .nightWorkMinutes(120)
                    .basicPay(412800L)
                    .totalAllowance(82560L)
                    .totalDeduction(16347L)
                    .netPay(479013L)
                    .build();
            ReflectionTestUtils.setField(p, "id", 1001L);

            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployee(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of(p));
            given(attendanceRepository
                    .findAllByEmployeeIdInAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                            eq(List.of(10L)), any(LocalDate.class), any(LocalDate.class)))
                    .willReturn(List.of());
            given(calculationService.calculateOvertimeMinutes(
                    anyList(), eq(true), eq(false), eq(LocalDate.of(2026, 2, 1))))
                    .willReturn(45);

            // when
            PayrollResponseDto.StorePayrollSummary result =
                    payrollQueryService.getStorePayrolls(100L, 1L, LocalDate.of(2026, 2, 1));

            // then
            PayrollResponseDto.EmployeePayrollSummary emp = result.getEmployees().get(0);
            assertThat(emp.getHourlyWage()).isEqualTo(10320);
            assertThat(emp.getNightWorkMinutes()).isEqualTo(120);
            assertThat(emp.getOvertimeMinutes()).isEqualTo(45);
            assertThat(emp.getIsTransferred()).isFalse();
            assertThat(emp.getTransferredAt()).isNull();
        }
    }

    // ═══════════════════════════════════════════════════════
    // 급여 승인 (approvePayroll)
    // ═══════════════════════════════════════════════════════

    @Nested
    @DisplayName("급여 승인 (approvePayroll)")
    class ApprovePayrollTest {

        @Test
        @DisplayName("성공: 사장님이 급여 승인")
        void success() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));
            given(payrollRepository.findById(1000L)).willReturn(Optional.of(payroll));

            // when
            payrollQueryService.approvePayroll(100L, 1L, 1000L);

            // then
            assertThat(payroll.getIsApproved()).isTrue();
            assertThat(payroll.getApprovedAt()).isNotNull();
        }

        @Test
        @DisplayName("실패: 매장 소유자가 아닌 사용자 → PAYROLL_STORE_NOT_OWNED")
        void fail_notOwner() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            // when & then
            assertThatThrownBy(() -> payrollQueryService.approvePayroll(999L, 1L, 1000L))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAYROLL_STORE_NOT_OWNED);
        }

        @Test
        @DisplayName("실패: 이미 승인된 급여 → PAYROLL_ALREADY_APPROVED")
        void fail_alreadyApproved() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));
            payroll.approve();  // 먼저 승인
            given(payrollRepository.findById(1000L)).willReturn(Optional.of(payroll));

            // when & then
            assertThatThrownBy(() -> payrollQueryService.approvePayroll(100L, 1L, 1000L))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAYROLL_ALREADY_APPROVED);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 급여 상세 조회 (getPayrollDetail)
    // ═══════════════════════════════════════════════════════

    @Nested
    @DisplayName("급여 상세 조회 (getPayrollDetail)")
    class GetPayrollDetailTest {

        @Test
        @DisplayName("실패: 다른 매장의 급여 → PAYROLL_ACCESS_DENIED")
        void fail_differentStore() {
            // given
            given(payrollRepository.findById(1000L)).willReturn(Optional.of(payroll));

            // payroll은 storeId=1인데, storeId=999로 조회 시도
            assertThatThrownBy(() -> payrollQueryService.getPayrollDetail(200L, 999L, 1000L))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAYROLL_ACCESS_DENIED);
        }

        @Test
        @DisplayName("실패: 소유자도 본인도 아닌 사용자 → PAYROLL_ACCESS_DENIED")
        void fail_noAccess() {
            // given
            given(payrollRepository.findById(1000L)).willReturn(Optional.of(payroll));

            // userId=999는 소유자(100L)도 아니고 직원 본인(200L)도 아님
            assertThatThrownBy(() -> payrollQueryService.getPayrollDetail(999L, 1L, 1000L))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAYROLL_ACCESS_DENIED);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 급여 지출 요약 — 완료된 월 (buildCompleteMonthSummary)
    // ═══════════════════════════════════════════════════════

    @Nested
    @DisplayName("급여 지출 요약 - 완료된 월 (getMonthlySummary)")
    class CompleteMonthlySummaryTest {

        @Test
        @DisplayName("성공: 전월 대비 증감률 계산 (UP)")
        void success_changeRateUp() {
            // given — 2026-02 (완료된 월) 조회
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            Payroll thisPayroll = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .totalWorkMinutes(2400)
                    .netPay(500000L)
                    .build();
            ReflectionTestUtils.setField(thisPayroll, "id", 2001L);

            Payroll lastPayroll = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 1, 1))
                    .totalWorkMinutes(2000)
                    .netPay(400000L)
                    .build();
            ReflectionTestUtils.setField(lastPayroll, "id", 2002L);

            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployee(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of(thisPayroll));
            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 1, 1)))
                    .willReturn(List.of(lastPayroll));

            // 수당 항목 mock
            given(payrollDetailRepository.findAllowancesByStoreIdAndTargetMonth(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of(
                            createAllowanceDetail(thisPayroll, "주휴수당", 50000L),
                            createAllowanceDetail(thisPayroll, "연장근로수당", 30000L),
                            createAllowanceDetail(thisPayroll, "야간근로수당", 10000L)
                    ));
            given(payrollDetailRepository.findAllowancesByStoreIdAndTargetMonth(1L, LocalDate.of(2026, 1, 1)))
                    .willReturn(List.of(
                            createAllowanceDetail(lastPayroll, "주휴수당", 40000L),
                            createAllowanceDetail(lastPayroll, "연장근로수당", 20000L)
                    ));

            // when
            PayrollResponseDto.MonthlySummary result =
                    payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 2, 1));

            // then
            assertThat(result.getIsPartialMonth()).isFalse();
            assertThat(result.getTargetMonth()).isEqualTo("2026-02");
            assertThat(result.getThisMonthTotal()).isEqualTo(500000L);
            assertThat(result.getLastMonthTotal()).isEqualTo(400000L);
            assertThat(result.getChangeRate()).isEqualTo(25.0);
            assertThat(result.getChangeDirection()).isEqualTo("UP");

            // 비교 기간: 완료된 월 → 전체 월
            assertThat(result.getThisMonthStart()).isEqualTo(LocalDate.of(2026, 2, 1));
            assertThat(result.getThisMonthEnd()).isEqualTo(LocalDate.of(2026, 2, 28));
            assertThat(result.getLastMonthStart()).isEqualTo(LocalDate.of(2026, 1, 1));
            assertThat(result.getLastMonthEnd()).isEqualTo(LocalDate.of(2026, 1, 31));

            // 수당 비교
            assertThat(result.getThisMonthWeeklyHolidayPay()).isEqualTo(50000L);
            assertThat(result.getThisMonthOvertimePay()).isEqualTo(30000L);
            assertThat(result.getThisMonthNightPay()).isEqualTo(10000L);
            assertThat(result.getLastMonthWeeklyHolidayPay()).isEqualTo(40000L);
            assertThat(result.getLastMonthOvertimePay()).isEqualTo(20000L);
            assertThat(result.getLastMonthNightPay()).isEqualTo(0L);
        }

        @Test
        @DisplayName("성공: 전월 대비 감소 (DOWN)")
        void success_changeRateDown() {
            // given — 2026-02 조회
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            Payroll thisPayroll = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .netPay(300000L)
                    .build();
            ReflectionTestUtils.setField(thisPayroll, "id", 2003L);

            Payroll lastPayroll = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 1, 1))
                    .netPay(400000L)
                    .build();
            ReflectionTestUtils.setField(lastPayroll, "id", 2004L);

            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployee(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of(thisPayroll));
            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 1, 1)))
                    .willReturn(List.of(lastPayroll));
            given(payrollDetailRepository.findAllowancesByStoreIdAndTargetMonth(eq(1L), any(LocalDate.class)))
                    .willReturn(List.of());

            // when
            PayrollResponseDto.MonthlySummary result =
                    payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 2, 1));

            // then
            assertThat(result.getChangeRate()).isEqualTo(-25.0);
            assertThat(result.getChangeDirection()).isEqualTo("DOWN");
        }

        @Test
        @DisplayName("성공: 전월 데이터 없으면 증감률 null, UNCHANGED")
        void success_noLastMonth() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            Payroll thisPayroll = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .netPay(500000L)
                    .build();
            ReflectionTestUtils.setField(thisPayroll, "id", 2005L);

            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployee(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of(thisPayroll));
            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 1, 1)))
                    .willReturn(List.of());
            given(payrollDetailRepository.findAllowancesByStoreIdAndTargetMonth(eq(1L), any(LocalDate.class)))
                    .willReturn(List.of());

            // when
            PayrollResponseDto.MonthlySummary result =
                    payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 2, 1));

            // then
            assertThat(result.getChangeRate()).isNull();
            assertThat(result.getChangeDirection()).isEqualTo("UNCHANGED");
        }

        @Test
        @DisplayName("성공: 직원 리스트가 netPay 내림차순 + 최고급여자 추출")
        void success_employeeListAndTopEarners() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            Payroll p1 = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .netPay(300000L)
                    .build();
            ReflectionTestUtils.setField(p1, "id", 2006L);

            Payroll p2 = Payroll.builder()
                    .employee(employee2)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .netPay(500000L)
                    .build();
            ReflectionTestUtils.setField(p2, "id", 2007L);

            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployee(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of(p1, p2));
            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 1, 1)))
                    .willReturn(List.of());
            given(payrollDetailRepository.findAllowancesByStoreIdAndTargetMonth(eq(1L), any(LocalDate.class)))
                    .willReturn(List.of());

            // when
            PayrollResponseDto.MonthlySummary result =
                    payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 2, 1));

            // then — netPay 내림차순
            assertThat(result.getEmployees()).hasSize(2);
            assertThat(result.getEmployees().get(0).getNetPay()).isEqualTo(500000L);
            assertThat(result.getEmployees().get(0).getEmployeeName()).isEqualTo("알바생B");
            assertThat(result.getEmployees().get(1).getNetPay()).isEqualTo(300000L);

            // 최고급여자
            assertThat(result.getTopEarners()).hasSize(1);
            assertThat(result.getTopEarners().get(0).getEmployeeId()).isEqualTo(11L);
        }

        @Test
        @DisplayName("성공: 최고급여자 동점 시 복수 반환")
        void success_topEarnersTie() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            Payroll p1 = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .netPay(500000L)
                    .build();
            ReflectionTestUtils.setField(p1, "id", 2008L);

            Payroll p2 = Payroll.builder()
                    .employee(employee2)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .netPay(500000L)  // 동점
                    .build();
            ReflectionTestUtils.setField(p2, "id", 2009L);

            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployee(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of(p1, p2));
            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 1, 1)))
                    .willReturn(List.of());
            given(payrollDetailRepository.findAllowancesByStoreIdAndTargetMonth(eq(1L), any(LocalDate.class)))
                    .willReturn(List.of());

            // when
            PayrollResponseDto.MonthlySummary result =
                    payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 2, 1));

            // then — 동점이므로 2명 모두 topEarners
            assertThat(result.getTopEarners()).hasSize(2);
            assertThat(result.getTopEarners().get(0).getNetPay()).isEqualTo(500000L);
            assertThat(result.getTopEarners().get(1).getNetPay()).isEqualTo(500000L);
        }

        @Test
        @DisplayName("성공: 직원 없는 완료 월 → 빈 리스트, total=0")
        void success_noEmployees() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployee(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of());
            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 1, 1)))
                    .willReturn(List.of());
            given(payrollDetailRepository.findAllowancesByStoreIdAndTargetMonth(eq(1L), any(LocalDate.class)))
                    .willReturn(List.of());

            // when
            PayrollResponseDto.MonthlySummary result =
                    payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 2, 1));

            // then
            assertThat(result.getThisMonthTotal()).isEqualTo(0L);
            assertThat(result.getLastMonthTotal()).isEqualTo(0L);
            assertThat(result.getEmployeeCount()).isEqualTo(0);
            assertThat(result.getEmployees()).isEmpty();
            assertThat(result.getTopEarners()).isEmpty();
        }
    }

    // ═══════════════════════════════════════════════════════
    // 급여 지출 요약 — 진행 중인 월 (buildPartialMonthSummary)
    // ═══════════════════════════════════════════════════════

    @Nested
    @DisplayName("급여 지출 요약 - 진행 중인 월 (getMonthlySummary)")
    class PartialMonthlySummaryTest {

        /** 현재 월(2026-03)을 조회하면 진행 중인 월로 판별되어야 합니다. */
        @Test
        @DisplayName("성공: 진행 중인 월 → isPartialMonth=true, Attendance 기반 재계산")
        void success_partialMonth() {
            // given — 오늘=2026-03-30, targetMonth=2026-03
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findAllByStoreIdAndStatus(1L, StoreEmployeeStatus.WORKING))
                    .willReturn(List.of(employee));

            // Attendance mock (이번 달 + 이전 달)
            given(attendanceRepository
                    .findAllByEmployeeIdInAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                            eq(List.of(10L)), any(LocalDate.class), any(LocalDate.class)))
                    .willReturn(List.of());

            // 계산 mock — 각 항목 0원 반환
            given(calculationService.calculateTotalWorkMinutes(any())).willReturn(0);
            given(calculationService.calculateNightWorkMinutes(any())).willReturn(0);
            given(calculationService.calculateBasicPay(0, 10320)).willReturn(0L);
            given(calculationService.calculateWeeklyHolidayPay(any(), eq(10320), any(LocalDate.class)))
                    .willReturn(0L);
            given(calculationService.calculateOvertimePay(any(), eq(10320), eq(true), eq(false), any(LocalDate.class)))
                    .willReturn(0L);
            given(calculationService.calculateNightPay(0, 10320)).willReturn(0L);
            given(calculationService.calculateDeduction(eq(0L), eq(TaxType.INCOME_3_3))).willReturn(0L);

            // when
            PayrollResponseDto.MonthlySummary result =
                    payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 3, 1));

            // then
            assertThat(result.getIsPartialMonth()).isTrue();
            assertThat(result.getTargetMonth()).isEqualTo("2026-03");
            assertThat(result.getThisMonthStart()).isEqualTo(LocalDate.of(2026, 3, 1));
            // 어제 = 3/29
            assertThat(result.getThisMonthEnd()).isEqualTo(LocalDate.of(2026, 3, 29));
            // 이전 달: min(29, 2월 말일=28) = 2/28
            assertThat(result.getLastMonthStart()).isEqualTo(LocalDate.of(2026, 2, 1));
            assertThat(result.getLastMonthEnd()).isEqualTo(LocalDate.of(2026, 2, 28));
        }

        @Test
        @DisplayName("성공: 진행 중인 월에서 직원별 netPay 계산 + 리스트 정렬")
        void success_partialMonth_employeeCalc() {
            // given — 2명의 직원, 이번 달만 테스트
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findAllByStoreIdAndStatus(1L, StoreEmployeeStatus.WORKING))
                    .willReturn(List.of(employee, employee2));

            given(attendanceRepository
                    .findAllByEmployeeIdInAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                            eq(List.of(10L, 11L)), any(LocalDate.class), any(LocalDate.class)))
                    .willReturn(List.of());

            // employee (시급 10320): basicPay 100000, 수당 0, 공제 0 → netPay 100000
            given(calculationService.calculateTotalWorkMinutes(any())).willReturn(600);
            given(calculationService.calculateNightWorkMinutes(any())).willReturn(0);
            given(calculationService.calculateBasicPay(600, 10320)).willReturn(103200L);
            given(calculationService.calculateBasicPay(600, 12000)).willReturn(120000L);
            given(calculationService.calculateWeeklyHolidayPay(any(), anyInt(), any(LocalDate.class)))
                    .willReturn(0L);
            given(calculationService.calculateOvertimePay(any(), anyInt(), anyBoolean(), anyBoolean(), any(LocalDate.class)))
                    .willReturn(0L);
            given(calculationService.calculateNightPay(anyInt(), anyInt())).willReturn(0L);
            given(calculationService.calculateDeduction(anyLong(), eq(TaxType.INCOME_3_3))).willReturn(0L);

            // when
            PayrollResponseDto.MonthlySummary result =
                    payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 3, 1));

            // then
            assertThat(result.getIsPartialMonth()).isTrue();
            assertThat(result.getEmployeeCount()).isEqualTo(2);
            // netPay 내림차순 → employee2(120000) > employee(103200)
            assertThat(result.getEmployees().get(0).getNetPay())
                    .isGreaterThanOrEqualTo(result.getEmployees().get(1).getNetPay());
        }

        @Test
        @DisplayName("성공: 활성 직원 없으면 빈 응답")
        void success_noActiveEmployees() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findAllByStoreIdAndStatus(1L, StoreEmployeeStatus.WORKING))
                    .willReturn(List.of());

            // when
            PayrollResponseDto.MonthlySummary result =
                    payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 3, 1));

            // then
            assertThat(result.getIsPartialMonth()).isTrue();
            assertThat(result.getThisMonthTotal()).isEqualTo(0L);
            assertThat(result.getLastMonthTotal()).isEqualTo(0L);
            assertThat(result.getEmployeeCount()).isEqualTo(0);
            assertThat(result.getEmployees()).isEmpty();
            assertThat(result.getTopEarners()).isEmpty();
        }
    }

    // ═══════════════════════════════════════════════════════
    // 급여 지출 요약 — 공통 (권한 검증)
    // ═══════════════════════════════════════════════════════

    @Nested
    @DisplayName("급여 지출 요약 - 권한 (getMonthlySummary)")
    class MonthlySummaryAuthTest {

        @Test
        @DisplayName("실패: 매장 소유자가 아닌 사용자 → PAYROLL_STORE_NOT_OWNED")
        void fail_notOwner() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            // when & then
            assertThatThrownBy(() -> payrollQueryService.getMonthlySummary(999L, 1L, LocalDate.of(2026, 2, 1)))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAYROLL_STORE_NOT_OWNED);
        }

        @Test
        @DisplayName("실패: 존재하지 않는 매장 → STORE_NOT_FOUND")
        void fail_storeNotFound() {
            // given
            given(storeRepository.findById(999L)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> payrollQueryService.getMonthlySummary(100L, 999L, LocalDate.of(2026, 2, 1)))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.STORE_NOT_FOUND);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 매장 단위 급여 일괄 승인 (approveAllPayrolls)
    // ═══════════════════════════════════════════════════════

    @Nested
    @DisplayName("매장 단위 급여 일괄 승인 (approveAllPayrolls)")
    class ApproveAllPayrollsTest {

        @Test
        @DisplayName("성공: 미승인 급여만 승인하고 승인 건수 반환")
        void success_approveUnapproved() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            Payroll unapproved = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .netPay(500000L)
                    .build();
            ReflectionTestUtils.setField(unapproved, "id", 3001L);

            Payroll alreadyApproved = Payroll.builder()
                    .employee(employee2)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .netPay(400000L)
                    .build();
            ReflectionTestUtils.setField(alreadyApproved, "id", 3002L);
            alreadyApproved.approve();

            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of(unapproved, alreadyApproved));

            // when
            int result = payrollQueryService.approveAllPayrolls(100L, 1L, LocalDate.of(2026, 2, 1));

            // then
            assertThat(result).isEqualTo(1);
            assertThat(unapproved.getIsApproved()).isTrue();
        }
    }
}
