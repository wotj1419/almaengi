package com.almaengi.be.domain.payroll.scheduler;

import com.almaengi.be.domain.notification.service.NotificationService;
import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.payroll.service.PayrollService;
import com.almaengi.be.domain.payroll.service.PayslipService;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.auth.type.LoginType;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PayrollGenerationScheduler 단위 테스트")
class PayrollGenerationSchedulerTest {

    @InjectMocks
    private PayrollGenerationScheduler scheduler;

    @Mock
    private StoreRepository storeRepository;
    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    @Mock
    private PayrollService payrollService;
    @Mock
    private PayslipService payslipService;
    @Mock
    private NotificationService notificationService;

    private User createOwner() {
        User owner = User.builder()
                .loginType(LoginType.LOCAL)
                .name("사장님")
                .email("owner@test.com")
                .build();
        ReflectionTestUtils.setField(owner, "id", 1L);
        return owner;
    }

    private Store createStore(User owner) {
        Store store = Store.builder()
                .owner(owner)
                .name("알맹이카페")
                .address("서울시 강남구")
                .build();
        ReflectionTestUtils.setField(store, "id", 1L);
        return store;
    }

    private StoreEmployee createStoreEmployee(Store store, User user, Long empId) {
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
        ReflectionTestUtils.setField(employee, "id", empId);
        return employee;
    }

    @Nested
    @DisplayName("스케줄러 실행 (generateMonthlyPayrollsAndPayslips)")
    class GenerateMonthlyTest {

        @Test
        @DisplayName("스킵: 운영 중인 매장 없음")
        void skip_noActiveStores() {
            // given
            given(storeRepository.findAllActiveWithOwner()).willReturn(List.of());

            // when
            scheduler.generateMonthlyPayrollsAndPayslips();

            // then
            verify(payrollService, never()).generateStorePayrolls(any(), any(), any());
            verify(payslipService, never()).generateStorePayslips(any(), any());
            verify(notificationService, never()).sendNotification(any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("성공: 정산 + 명세서 + 알림 순차 실행")
        void success_fullFlow() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);

            User empUser = User.builder()
                    .loginType(LoginType.LOCAL)
                    .name("알바생")
                    .email("emp@test.com")
                    .build();
            ReflectionTestUtils.setField(empUser, "id", 2L);
            StoreEmployee emp = createStoreEmployee(store, empUser, 10L);

            given(storeRepository.findAllActiveWithOwner()).willReturn(List.of(store));
            given(storeEmployeeRepository.findAllByStoreIdAndStatusWithUser(1L, StoreEmployeeStatus.WORKING))
                    .willReturn(List.of(emp));

            // when
            scheduler.generateMonthlyPayrollsAndPayslips();

            // then
            verify(payrollService).generateStorePayrolls(eq(1L), eq(1L), any(LocalDate.class));
            verify(payslipService).generateStorePayslips(eq(1L), any(LocalDate.class));

            // 사장님 알림 1건 + 알바생 알림 1건 = 총 2건
            verify(notificationService, times(2)).sendNotification(
                    any(User.class), eq(NotificationType.SALARY), anyString(), anyString(), any());
        }

        @Test
        @DisplayName("알림 실패 시에도 다음 매장 계속 처리")
        void continuesOnNotificationFailure() {
            // given
            User owner = createOwner();
            Store store1 = createStore(owner);
            ReflectionTestUtils.setField(store1, "id", 1L);

            Store store2 = Store.builder()
                    .owner(owner)
                    .name("알맹이카페2호점")
                    .address("서울시 서초구")
                    .build();
            ReflectionTestUtils.setField(store2, "id", 2L);

            given(storeRepository.findAllActiveWithOwner()).willReturn(List.of(store1, store2));
            given(storeEmployeeRepository.findAllByStoreIdAndStatusWithUser(anyLong(), eq(StoreEmployeeStatus.WORKING)))
                    .willReturn(List.of());

            // 첫 매장 사장님 알림에서 예외 발생
            doThrow(new RuntimeException("FCM 오류"))
                    .doNothing()
                    .when(notificationService).sendNotification(any(), any(), any(), any(), any());

            // when
            scheduler.generateMonthlyPayrollsAndPayslips();

            // then - 두 매장 모두 정산/명세서 수행됨
            verify(payrollService, times(2)).generateStorePayrolls(any(), anyLong(), any());
            verify(payslipService, times(2)).generateStorePayslips(anyLong(), any());
        }

        @Test
        @DisplayName("매장 처리 중 예외 발생 시 다음 매장 계속 처리")
        void continuesOnStoreProcessingFailure() {
            // given
            User owner = createOwner();
            Store store1 = createStore(owner);
            ReflectionTestUtils.setField(store1, "id", 1L);

            Store store2 = Store.builder()
                    .owner(owner)
                    .name("알맹이카페2호점")
                    .address("서울시 서초구")
                    .build();
            ReflectionTestUtils.setField(store2, "id", 2L);

            given(storeRepository.findAllActiveWithOwner()).willReturn(List.of(store1, store2));

            // 첫 매장 정산에서 예외
            doThrow(new RuntimeException("DB 오류"))
                    .when(payrollService).generateStorePayrolls(eq(1L), eq(1L), any());

            given(storeEmployeeRepository.findAllByStoreIdAndStatusWithUser(2L, StoreEmployeeStatus.WORKING))
                    .willReturn(List.of());

            // when
            scheduler.generateMonthlyPayrollsAndPayslips();

            // then - 두 번째 매장은 정상 처리됨
            verify(payrollService).generateStorePayrolls(eq(1L), eq(2L), any());
            verify(payslipService).generateStorePayslips(eq(2L), any());
        }
    }

    @Nested
    @DisplayName("알림 발송 (sendPayslipNotifications)")
    class NotificationTest {

        @Test
        @DisplayName("사장님 + 알바생 다수에게 알림 발송")
        void sendsToOwnerAndMultipleEmployees() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);

            User empUser1 = User.builder().loginType(LoginType.LOCAL).name("알바A").email("a@test.com").build();
            ReflectionTestUtils.setField(empUser1, "id", 2L);
            User empUser2 = User.builder().loginType(LoginType.LOCAL).name("알바B").email("b@test.com").build();
            ReflectionTestUtils.setField(empUser2, "id", 3L);

            StoreEmployee emp1 = createStoreEmployee(store, empUser1, 10L);
            StoreEmployee emp2 = createStoreEmployee(store, empUser2, 11L);

            given(storeRepository.findAllActiveWithOwner()).willReturn(List.of(store));
            given(storeEmployeeRepository.findAllByStoreIdAndStatusWithUser(1L, StoreEmployeeStatus.WORKING))
                    .willReturn(List.of(emp1, emp2));

            // when
            scheduler.generateMonthlyPayrollsAndPayslips();

            // then - 사장님 1건 + 알바생 2건 = 총 3건
            verify(notificationService, times(3)).sendNotification(
                    any(User.class), eq(NotificationType.SALARY), anyString(), anyString(), any());

            // 사장님 알림: title = "급여명세서 생성 완료"
            verify(notificationService).sendNotification(
                    eq(owner), eq(NotificationType.SALARY),
                    eq("급여명세서 생성 완료"), contains("알맹이카페"), eq(1L));

            // 알바생 알림: title = "급여명세서 확인"
            verify(notificationService).sendNotification(
                    eq(empUser1), eq(NotificationType.SALARY),
                    eq("급여명세서 확인"), contains("급여명세서가 도착했습니다"), eq(10L));
            verify(notificationService).sendNotification(
                    eq(empUser2), eq(NotificationType.SALARY),
                    eq("급여명세서 확인"), contains("급여명세서가 도착했습니다"), eq(11L));
        }

        @Test
        @DisplayName("알바생 알림 실패해도 나머지 알림 계속 발송")
        void continuesOnEmployeeNotificationFailure() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);

            User empUser1 = User.builder().loginType(LoginType.LOCAL).name("알바A").email("a@test.com").build();
            ReflectionTestUtils.setField(empUser1, "id", 2L);
            User empUser2 = User.builder().loginType(LoginType.LOCAL).name("알바B").email("b@test.com").build();
            ReflectionTestUtils.setField(empUser2, "id", 3L);

            StoreEmployee emp1 = createStoreEmployee(store, empUser1, 10L);
            StoreEmployee emp2 = createStoreEmployee(store, empUser2, 11L);

            given(storeRepository.findAllActiveWithOwner()).willReturn(List.of(store));
            given(storeEmployeeRepository.findAllByStoreIdAndStatusWithUser(1L, StoreEmployeeStatus.WORKING))
                    .willReturn(List.of(emp1, emp2));

            // 사장님 OK, 알바A 실패, 알바B OK
            doNothing()
                    .doThrow(new RuntimeException("FCM 오류"))
                    .doNothing()
                    .when(notificationService).sendNotification(any(), any(), any(), any(), any());

            // when
            scheduler.generateMonthlyPayrollsAndPayslips();

            // then - 3번 모두 호출 시도됨
            verify(notificationService, times(3)).sendNotification(
                    any(User.class), eq(NotificationType.SALARY), anyString(), anyString(), any());
        }
    }
}
