package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.finance.service.SsafyFinanceService;
import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.repository.PayrollRepository;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayrollTransferServiceTest {

    @InjectMocks
    private PayrollTransferService payrollTransferService;

    @Mock
    private PayrollRepository payrollRepository;
    @Mock
    private SsafyFinanceService ssafyFinanceService;

    private static final LocalDate TARGET_MONTH = LocalDate.of(2026, 2, 1);
    private static final String OWNER_USER_KEY = "owner-user-key-123";
    private static final String OWNER_ACCOUNT = "0011234567890";
    private static final String EMPLOYEE_ACCOUNT = "0019876543210";

    private User createOwner() {
        User owner = User.builder()
                .loginType(LoginType.LOCAL)
                .name("사장님")
                .email("owner@test.com")
                .build();
        ReflectionTestUtils.setField(owner, "id", 1L);
        ReflectionTestUtils.setField(owner, "accountNo", OWNER_ACCOUNT);
        return owner;
    }

    private User createEmployeeUser() {
        User user = User.builder()
                .loginType(LoginType.LOCAL)
                .name("알바생")
                .email("employee@test.com")
                .build();
        ReflectionTestUtils.setField(user, "id", 2L);
        ReflectionTestUtils.setField(user, "accountNo", EMPLOYEE_ACCOUNT);
        return user;
    }

    private Store createStore(User owner) {
        Store store = Store.builder()
                .owner(owner)
                .name("알맹이카페")
                .address("서울시 강남구")
                .build();
        ReflectionTestUtils.setField(store, "id", 1L);
        ReflectionTestUtils.setField(store, "payDay", 24);
        return store;
    }

    private StoreEmployee createStoreEmployee(Store store, User user) {
        StoreEmployee employee = StoreEmployee.builder()
                .store(store)
                .user(user)
                .status(StoreEmployeeStatus.WORKING)
                .hourlyWage(10030)
                .taxType(TaxType.INCOME_3_3)
                .workedMinutes(0)
                .willWorkingMinutes(0)
                .dependentsCount(0)
                .includeHolidayPay(true)
                .build();
        ReflectionTestUtils.setField(employee, "id", 10L);
        return employee;
    }

    private Payroll createApprovedPayroll(StoreEmployee employee, long netPay) {
        Payroll payroll = Payroll.builder()
                .employee(employee)
                .targetMonth(TARGET_MONTH)
                .totalWorkMinutes(2400)
                .nightWorkMinutes(0)
                .basicPay(netPay)
                .totalAllowance(0L)
                .totalDeduction(0L)
                .netPay(netPay)
                .build();
        payroll.approve();
        return payroll;
    }

    @Nested
    @DisplayName("매장 급여 이체 (transferStorePayroll)")
    class TransferStorePayrollTest {

        @Test
        @DisplayName("성공: 승인된 급여를 정상 이체")
        void success() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);
            User empUser = createEmployeeUser();
            StoreEmployee emp = createStoreEmployee(store, empUser);
            Payroll payroll = createApprovedPayroll(emp, 500000L);

            given(payrollRepository.findApprovedByStoreIdAndTargetMonth(1L, TARGET_MONTH))
                    .willReturn(List.of(payroll));
            given(ssafyFinanceService.searchMemberKey("owner@test.com"))
                    .willReturn(OWNER_USER_KEY);
            given(ssafyFinanceService.inquireBalance(OWNER_USER_KEY, OWNER_ACCOUNT))
                    .willReturn(1000000L);

            // when
            payrollTransferService.transferStorePayroll(store, TARGET_MONTH);

            // then
            assertThat(payroll.getIsTransferred()).isTrue();
            assertThat(payroll.getTransferredAt()).isNotNull();
            verify(ssafyFinanceService).transferDemandDeposit(
                    eq(OWNER_USER_KEY),
                    eq(OWNER_ACCOUNT),
                    eq(EMPLOYEE_ACCOUNT),
                    eq(500000L),
                    eq("알바생 2월 급여"),
                    eq("알맹이카페 2월 급여")
            );
        }

        @Test
        @DisplayName("스킵: 승인된 급여 없음")
        void skip_noApprovedPayrolls() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);

            given(payrollRepository.findApprovedByStoreIdAndTargetMonth(1L, TARGET_MONTH))
                    .willReturn(List.of());

            // when
            payrollTransferService.transferStorePayroll(store, TARGET_MONTH);

            // then
            verify(ssafyFinanceService, never()).searchMemberKey(any());
            verify(ssafyFinanceService, never()).transferDemandDeposit(any(), any(), any(), anyLong(), any(), any());
        }

        @Test
        @DisplayName("스킵: 모든 급여 이미 이체 완료")
        void skip_allAlreadyTransferred() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);
            User empUser = createEmployeeUser();
            StoreEmployee emp = createStoreEmployee(store, empUser);
            Payroll payroll = createApprovedPayroll(emp, 500000L);
            payroll.completeTransfer();

            given(payrollRepository.findApprovedByStoreIdAndTargetMonth(1L, TARGET_MONTH))
                    .willReturn(List.of(payroll));

            // when
            payrollTransferService.transferStorePayroll(store, TARGET_MONTH);

            // then
            verify(ssafyFinanceService, never()).searchMemberKey(any());
            verify(ssafyFinanceService, never()).transferDemandDeposit(any(), any(), any(), anyLong(), any(), any());
        }

        @Test
        @DisplayName("실패: 잔액 부족 → TRANSFER_INSUFFICIENT_BALANCE")
        void fail_insufficientBalance() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);
            User empUser = createEmployeeUser();
            StoreEmployee emp = createStoreEmployee(store, empUser);
            Payroll payroll = createApprovedPayroll(emp, 500000L);

            given(payrollRepository.findApprovedByStoreIdAndTargetMonth(1L, TARGET_MONTH))
                    .willReturn(List.of(payroll));
            given(ssafyFinanceService.searchMemberKey("owner@test.com"))
                    .willReturn(OWNER_USER_KEY);
            given(ssafyFinanceService.inquireBalance(OWNER_USER_KEY, OWNER_ACCOUNT))
                    .willReturn(100000L); // 잔액 부족

            // when & then
            assertThatThrownBy(() -> payrollTransferService.transferStorePayroll(store, TARGET_MONTH))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.TRANSFER_INSUFFICIENT_BALANCE);

            assertThat(payroll.getIsTransferred()).isFalse();
            verify(ssafyFinanceService, never()).transferDemandDeposit(any(), any(), any(), anyLong(), any(), any());
        }

        @Test
        @DisplayName("실패: 금융망 이체 API 오류 → TRANSFER_FAILED")
        void fail_transferApiError() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);
            User empUser = createEmployeeUser();
            StoreEmployee emp = createStoreEmployee(store, empUser);
            Payroll payroll = createApprovedPayroll(emp, 500000L);

            given(payrollRepository.findApprovedByStoreIdAndTargetMonth(1L, TARGET_MONTH))
                    .willReturn(List.of(payroll));
            given(ssafyFinanceService.searchMemberKey("owner@test.com"))
                    .willReturn(OWNER_USER_KEY);
            given(ssafyFinanceService.inquireBalance(OWNER_USER_KEY, OWNER_ACCOUNT))
                    .willReturn(1000000L);
            doThrow(new RuntimeException("금융망 오류"))
                    .when(ssafyFinanceService).transferDemandDeposit(any(), any(), any(), anyLong(), any(), any());

            // when & then
            assertThatThrownBy(() -> payrollTransferService.transferStorePayroll(store, TARGET_MONTH))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.TRANSFER_FAILED);

            assertThat(payroll.getIsTransferred()).isFalse();
        }

        @Test
        @DisplayName("성공: 여러 직원 급여 일괄 이체")
        void success_multipleEmployees() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);

            User empUser1 = createEmployeeUser();
            ReflectionTestUtils.setField(empUser1, "name", "알바생A");
            StoreEmployee emp1 = createStoreEmployee(store, empUser1);
            Payroll payroll1 = createApprovedPayroll(emp1, 300000L);

            User empUser2 = User.builder()
                    .loginType(LoginType.LOCAL)
                    .name("알바생B")
                    .email("employee2@test.com")
                    .build();
            ReflectionTestUtils.setField(empUser2, "id", 3L);
            ReflectionTestUtils.setField(empUser2, "accountNo", "0011111111111");
            StoreEmployee emp2 = createStoreEmployee(store, empUser2);
            ReflectionTestUtils.setField(emp2, "id", 11L);
            Payroll payroll2 = createApprovedPayroll(emp2, 200000L);

            given(payrollRepository.findApprovedByStoreIdAndTargetMonth(1L, TARGET_MONTH))
                    .willReturn(List.of(payroll1, payroll2));
            given(ssafyFinanceService.searchMemberKey("owner@test.com"))
                    .willReturn(OWNER_USER_KEY);
            given(ssafyFinanceService.inquireBalance(OWNER_USER_KEY, OWNER_ACCOUNT))
                    .willReturn(1000000L); // 잔액 충분 (300000 + 200000 = 500000)

            // when
            payrollTransferService.transferStorePayroll(store, TARGET_MONTH);

            // then
            assertThat(payroll1.getIsTransferred()).isTrue();
            assertThat(payroll2.getIsTransferred()).isTrue();
            verify(ssafyFinanceService, times(2))
                    .transferDemandDeposit(any(), any(), any(), anyLong(), any(), any());
        }
    }
}
