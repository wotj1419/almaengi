package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.repository.PayrollDetailRepository;
import com.almaengi.be.domain.payroll.repository.PayrollRepository;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PayrollGenerateServiceTest {

    @InjectMocks
    private PayrollGenerateService generateService;

    @Mock
    private PayrollRepository payrollRepository;
    @Mock
    private PayrollDetailRepository payrollDetailRepository;
    @Mock
    private AttendanceRepository attendanceRepository;
    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    @Mock
    private PayrollCalculationService calculationService;

    private StoreEmployee createMockEmployee() {
        Store store = Store.builder()
                .name("테스트매장")
                .address("서울시")
                .isOver5Employees(true)
                .build();
        ReflectionTestUtils.setField(store, "id", 1L);

        StoreEmployee employee = StoreEmployee.builder()
                .store(store)
                .hourlyWage(10320)
                .taxType(TaxType.INCOME_3_3)
                .includeHolidayPay(false)
                .build();
        ReflectionTestUtils.setField(employee, "id", 10L);

        return employee;
    }

    @Nested
    @DisplayName("급여 생성 (generatePayroll)")
    class GeneratePayrollTest {

        @Test
        @DisplayName("성공: 급여 + 상세내역 저장")
        void success() {
            // given
            Long employeeId = 10L;
            LocalDate targetMonth = LocalDate.of(2026, 3, 1);
            StoreEmployee employee = createMockEmployee();

            given(payrollRepository.existsByEmployeeIdAndTargetMonth(employeeId, targetMonth))
                    .willReturn(false);
            given(storeEmployeeRepository.findById(employeeId))
                    .willReturn(Optional.of(employee));

            // 출퇴근 기록 조회 (해당 월 + 주휴수당용 확장 범위 모두 동일한 mock 사용)
            given(attendanceRepository
                    .findAllByEmployeeIdAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                            eq(employeeId), any(LocalDate.class), any(LocalDate.class)))
                    .willReturn(List.of());

            given(calculationService.calculateTotalWorkMinutes(any())).willReturn(2400);
            given(calculationService.calculateNightWorkMinutes(any())).willReturn(0);
            given(calculationService.calculateBasicPay(2400, 10320)).willReturn(412800L);
            given(calculationService.calculateWeeklyHolidayPay(any(), eq(10320), eq(targetMonth)))
                    .willReturn(82560L);
            given(calculationService.calculateOvertimePay(any(), eq(10320), eq(true), eq(false), eq(targetMonth)))
                    .willReturn(0L);
            given(calculationService.calculateNightPay(0, 10320)).willReturn(0L);
            given(calculationService.calculateDeduction(495360L, TaxType.INCOME_3_3)).willReturn(16347L);
            given(calculationService.calculateDeductionDetails(495360L, TaxType.INCOME_3_3))
                    .willReturn(Map.of("소득세(3%)", 14861L, "지방소득세(0.3%)", 1486L));

            // when
            Payroll result = generateService.generatePayroll(employeeId, targetMonth);

            // then
            assertThat(result.getBasicPay()).isEqualTo(412800L);
            assertThat(result.getTotalAllowance()).isEqualTo(82560L);
            assertThat(result.getNetPay()).isEqualTo(479013L);
            verify(payrollRepository).save(any(Payroll.class));
            verify(payrollDetailRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("실패: 이미 해당 월 급여 존재 → PAYROLL_ALREADY_EXISTS")
        void fail_alreadyExists() {
            // given
            Long employeeId = 10L;
            LocalDate targetMonth = LocalDate.of(2026, 3, 1);

            given(payrollRepository.existsByEmployeeIdAndTargetMonth(employeeId, targetMonth))
                    .willReturn(true);

            // when & then
            assertThatThrownBy(() -> generateService.generatePayroll(employeeId, targetMonth))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAYROLL_ALREADY_EXISTS);
        }

        @Test
        @DisplayName("실패: 동시성 race condition → DB unique 위반 시 PAYROLL_ALREADY_EXISTS")
        void fail_concurrentRaceCondition() {
            // given
            Long employeeId = 10L;
            LocalDate targetMonth = LocalDate.of(2026, 3, 1);
            StoreEmployee employee = createMockEmployee();

            given(payrollRepository.existsByEmployeeIdAndTargetMonth(employeeId, targetMonth))
                    .willReturn(false);
            given(storeEmployeeRepository.findById(employeeId))
                    .willReturn(Optional.of(employee));
            given(attendanceRepository
                    .findAllByEmployeeIdAndTargetDateBetweenAndClockInIsNotNullAndClockOutIsNotNull(
                            eq(employeeId), any(LocalDate.class), any(LocalDate.class)))
                    .willReturn(List.of());

            given(calculationService.calculateTotalWorkMinutes(any())).willReturn(0);
            given(calculationService.calculateNightWorkMinutes(any())).willReturn(0);
            given(calculationService.calculateBasicPay(0, 10320)).willReturn(0L);
            given(calculationService.calculateWeeklyHolidayPay(any(), eq(10320), eq(targetMonth)))
                    .willReturn(0L);
            given(calculationService.calculateOvertimePay(any(), eq(10320), eq(true), eq(false), eq(targetMonth)))
                    .willReturn(0L);
            given(calculationService.calculateNightPay(0, 10320)).willReturn(0L);
            given(calculationService.calculateDeduction(0L, TaxType.INCOME_3_3)).willReturn(0L);

            // 동시 요청으로 인한 DB unique 제약 위반 시뮬레이션
            given(payrollRepository.save(any(Payroll.class)))
                    .willThrow(new DataIntegrityViolationException("Unique constraint violated"));

            // when & then
            assertThatThrownBy(() -> generateService.generatePayroll(employeeId, targetMonth))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PAYROLL_ALREADY_EXISTS);
        }
    }
}
