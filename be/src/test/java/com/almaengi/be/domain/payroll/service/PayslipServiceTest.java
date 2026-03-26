package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.document.repository.EmployeeDocumentRepository;
import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.repository.PayrollDetailRepository;
import com.almaengi.be.domain.payroll.repository.PayrollRepository;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.global.config.PayslipProperties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PayslipService 단위 테스트")
class PayslipServiceTest {

    @InjectMocks
    private PayslipService payslipService;

    @Mock
    private PayrollRepository payrollRepository;
    @Mock
    private PayrollDetailRepository payrollDetailRepository;
    @Mock
    private EmployeeDocumentRepository employeeDocumentRepository;
    @Mock
    private PayslipProperties payslipProperties;

    private static final LocalDate TARGET_MONTH = LocalDate.of(2026, 2, 1);

    private User createOwner() {
        User owner = User.builder()
                .loginType(LoginType.LOCAL)
                .name("사장님")
                .email("owner@test.com")
                .build();
        ReflectionTestUtils.setField(owner, "id", 1L);
        return owner;
    }

    private User createEmployeeUser() {
        User user = User.builder()
                .loginType(LoginType.LOCAL)
                .name("최진서")
                .email("employee@test.com")
                .build();
        ReflectionTestUtils.setField(user, "id", 2L);
        return user;
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

    private Payroll createPayroll(StoreEmployee employee) {
        Payroll payroll = Payroll.builder()
                .employee(employee)
                .targetMonth(TARGET_MONTH)
                .totalWorkMinutes(2400)
                .nightWorkMinutes(0)
                .basicPay(1000000L)
                .totalAllowance(200000L)
                .totalDeduction(33000L)
                .netPay(1167000L)
                .build();
        ReflectionTestUtils.setField(payroll, "id", 100L);
        return payroll;
    }

    @Nested
    @DisplayName("파일 경로 생성 (buildFilePath)")
    class BuildFilePathTest {

        @Test
        @DisplayName("성공: 결정적 경로 생성 (employeeId 기반)")
        void buildFilePath_deterministic() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);
            User empUser = createEmployeeUser();
            StoreEmployee emp = createStoreEmployee(store, empUser);
            Payroll payroll = createPayroll(emp);

            given(payslipProperties.getStoragePath()).willReturn("/home/ubuntu/documents");

            // when
            String path1 = payslipService.buildFilePath(payroll);
            String path2 = payslipService.buildFilePath(payroll);

            // then
            assertThat(path1).isEqualTo(path2);
            assertThat(path1).contains("stores" + File.separator + "1" + File.separator + "payslip");
            assertThat(path1).endsWith("최진서_10.pdf");
        }

        @Test
        @DisplayName("성공: 경로에 매장ID, 연월, 직원이름_직원ID 포함")
        void buildFilePath_containsExpectedParts() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);
            User empUser = createEmployeeUser();
            StoreEmployee emp = createStoreEmployee(store, empUser);
            Payroll payroll = createPayroll(emp);

            given(payslipProperties.getStoragePath()).willReturn("/data");

            // when
            String path = payslipService.buildFilePath(payroll);

            // then — OS 독립적으로 경로 구성 요소 검증
            assertThat(path).contains("stores");
            assertThat(path).contains("1");
            assertThat(path).contains("payslip");
            assertThat(path).contains("2026");
            assertThat(path).contains("02");
            assertThat(path).endsWith("최진서_10.pdf");
        }
    }

    @Nested
    @DisplayName("매장 일괄 급여명세서 생성 (generateStorePayslips)")
    class GenerateStorePayslipsTest {

        @Test
        @DisplayName("스킵: 대상 Payroll 없음")
        void skip_noPayrolls() {
            // given
            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployeeAndStore(1L, TARGET_MONTH))
                    .willReturn(List.of());

            // when
            payslipService.generateStorePayslips(1L, TARGET_MONTH);

            // then
            verify(payrollDetailRepository, never()).findAllByPayrollIdOrdered(any());
        }

        @Test
        @DisplayName("성공: 개별 생성 실패 시에도 나머지 계속 진행")
        void continuesOnIndividualFailure() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);
            User empUser = createEmployeeUser();
            StoreEmployee emp = createStoreEmployee(store, empUser);
            Payroll payroll1 = createPayroll(emp);
            ReflectionTestUtils.setField(payroll1, "id", 101L);

            User empUser2 = User.builder()
                    .loginType(LoginType.LOCAL)
                    .name("김철수")
                    .email("emp2@test.com")
                    .build();
            ReflectionTestUtils.setField(empUser2, "id", 3L);
            StoreEmployee emp2 = createStoreEmployee(store, empUser2);
            ReflectionTestUtils.setField(emp2, "id", 11L);
            Payroll payroll2 = createPayroll(emp2);
            ReflectionTestUtils.setField(payroll2, "id", 102L);

            given(payrollRepository.findAllByStoreIdAndTargetMonthWithEmployeeAndStore(1L, TARGET_MONTH))
                    .willReturn(List.of(payroll1, payroll2));

            // payrollDetail 조회 시 첫 번째는 예외, 두 번째는 빈 리스트 반환
            given(payrollDetailRepository.findAllByPayrollIdOrdered(101L))
                    .willThrow(new RuntimeException("DB 오류"));
            given(payrollDetailRepository.findAllByPayrollIdOrdered(102L))
                    .willReturn(List.of());

            // when - 예외가 전파되지 않음
            payslipService.generateStorePayslips(1L, TARGET_MONTH);

            // then - 두 번째 payroll에 대해서도 시도됨
            verify(payrollDetailRepository).findAllByPayrollIdOrdered(101L);
            verify(payrollDetailRepository).findAllByPayrollIdOrdered(102L);
        }
    }

    @Nested
    @DisplayName("단일 급여명세서 생성 (generatePayslip)")
    class GeneratePayslipTest {

        @Test
        @DisplayName("상세 항목 조회 후 템플릿 렌더링 시도")
        void queriesDetailsBeforeRendering() {
            // given
            User owner = createOwner();
            Store store = createStore(owner);
            User empUser = createEmployeeUser();
            StoreEmployee emp = createStoreEmployee(store, empUser);
            Payroll payroll = createPayroll(emp);

            given(payrollDetailRepository.findAllByPayrollIdOrdered(100L))
                    .willReturn(List.of());

            // when — templateEngine이 null이므로 RuntimeException 발생
            try {
                payslipService.generatePayslip(payroll);
            } catch (RuntimeException ignored) {
                // 단위 테스트 환경에서 @PostConstruct 미호출 → templateEngine null
            }

            // then — detail 조회는 반드시 수행됨
            verify(payrollDetailRepository).findAllByPayrollIdOrdered(100L);
        }
    }
}
