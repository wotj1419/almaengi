package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
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
import java.util.List;
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
    private Store store;
    private StoreEmployee employee;
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
                .name("알바생")
                .email("worker@test.com")
                .role(Role.EMPLOYEE)
                .build();
        ReflectionTestUtils.setField(worker, "id", 200L);

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

    @Nested
    @DisplayName("알바생 급여 조회 (getMyPayroll)")
    class GetMyPayrollTest {

        @Test
        @DisplayName("성공: 급여 존재 시 저장된 데이터 반환 (isEstimated=false)")
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
        }

        @Test
        @DisplayName("성공: 급여 미존재 시 실시간 미리보기 반환 (isEstimated=true)")
        void success_preview() {
            // given
            given(storeEmployeeRepository.findByStoreIdAndUserId(1L, 200L))
                    .willReturn(Optional.of(employee));
            given(payrollRepository.findByEmployeeIdAndTargetMonth(10L, LocalDate.of(2026, 3, 1)))
                    .willReturn(Optional.empty());

            // 출퇴근 기록 mock
            given(attendanceRepository
                    .findAllByEmployeeIdAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                            eq(10L), any(LocalDate.class), any(LocalDate.class)))
                    .willReturn(List.of());

            // 계산 결과 mock
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
                    .willReturn(java.util.Map.of());

            // when
            PayrollResponseDto.MyPayroll result = payrollQueryService.getMyPayroll(200L, 1L, LocalDate.of(2026, 3, 1));

            // then
            assertThat(result.getIsEstimated()).isTrue();
            assertThat(result.getPayrollId()).isNull();
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

    @Nested
    @DisplayName("급여 상세 조회 (getPayrollDetail)")
    class GetPayrollDetailTest {

        @Test
        @DisplayName("실패: 다른 매장의 급여 → PAYROLL_ACCESS_DENIED")
        void fail_differentStore() {
            // given
            Store otherStore = Store.builder()
                    .owner(owner)
                    .name("다른매장")
                    .address("부산시")
                    .qrCode("other-qr")
                    .build();
            ReflectionTestUtils.setField(otherStore, "id", 999L);

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

    @Nested
    @DisplayName("급여 지출 요약 (getMonthlySummary)")
    class MonthlySummaryTest {

        @Test
        @DisplayName("성공: 전월 대비 증감률 계산")
        void success_withChangeRate() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            Payroll thisMonthPayroll = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 3, 1))
                    .netPay(500000L)
                    .build();
            Payroll lastMonthPayroll = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 2, 1))
                    .netPay(400000L)
                    .build();

            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 3, 1)))
                    .willReturn(List.of(thisMonthPayroll));
            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of(lastMonthPayroll));

            // when
            PayrollResponseDto.MonthlySummary result = payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 3, 1));

            // then
            assertThat(result.getThisMonthTotal()).isEqualTo(500000L);
            assertThat(result.getLastMonthTotal()).isEqualTo(400000L);
            assertThat(result.getChangeRate()).isEqualTo(25.0);
            assertThat(result.getChangeDirection()).isEqualTo("UP");
        }

        @Test
        @DisplayName("성공: 전월 데이터 없으면 증감률 null, UNCHANGED")
        void success_noLastMonth() {
            // given
            given(storeRepository.findById(1L)).willReturn(Optional.of(store));

            Payroll thisMonthPayroll = Payroll.builder()
                    .employee(employee)
                    .targetMonth(LocalDate.of(2026, 3, 1))
                    .netPay(500000L)
                    .build();

            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 3, 1)))
                    .willReturn(List.of(thisMonthPayroll));
            given(payrollRepository.findAllByEmployeeStoreIdAndTargetMonth(1L, LocalDate.of(2026, 2, 1)))
                    .willReturn(List.of());

            // when
            PayrollResponseDto.MonthlySummary result = payrollQueryService.getMonthlySummary(100L, 1L, LocalDate.of(2026, 3, 1));

            // then
            assertThat(result.getChangeRate()).isNull();
            assertThat(result.getChangeDirection()).isEqualTo("UNCHANGED");
        }
    }
}
