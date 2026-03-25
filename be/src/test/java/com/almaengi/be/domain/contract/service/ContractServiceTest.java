package com.almaengi.be.domain.contract.service;

import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.contract.dto.ContractRequestDto;
import com.almaengi.be.domain.contract.dto.ContractResponseDto;
import com.almaengi.be.domain.contract.entity.Contract;
import com.almaengi.be.domain.contract.repository.ContractRepository;
import com.almaengi.be.domain.contract.type.ContractStatus;
import com.almaengi.be.domain.contract.type.PaymentMethod;
import com.almaengi.be.domain.contract.type.WageType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.config.ContractProperties;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ContractServiceTest {

    @InjectMocks
    private ContractService contractService;

    @Mock
    private ContractRepository contractRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    @Mock
    private ContractPdfService contractPdfService;
    @Mock
    private ContractProperties contractProperties;

    private User owner;
    private User employee;
    private Store store;
    private StoreEmployee storeEmployee;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .loginType(LoginType.LOCAL)
                .name("사장님")
                .email("owner@test.com")
                .role(Role.OWNER)
                .build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        employee = User.builder()
                .loginType(LoginType.LOCAL)
                .name("알바생")
                .email("emp@test.com")
                .phone("010-1234-5678")
                .role(Role.EMPLOYEE)
                .build();
        ReflectionTestUtils.setField(employee, "id", 2L);

        store = Store.builder()
                .owner(owner)
                .name("테스트카페")
                .address("서울 강남구 역삼동 123")
                .phone("02-1234-5678")
                .qrCode("qr-123")
                .build();
        ReflectionTestUtils.setField(store, "id", 10L);

        storeEmployee = StoreEmployee.builder()
                .store(store)
                .user(employee)
                .status(StoreEmployeeStatus.WORKING)
                .hourlyWage(10320)
                .taxType(TaxType.INCOME_3_3)
                .workedMinutes(0)
                .willWorkingMinutes(0)
                .dependentsCount(1)
                .includeHolidayPay(false)
                .build();
        ReflectionTestUtils.setField(storeEmployee, "id", 100L);
    }

    private ContractRequestDto.Create createRequest() {
        ContractRequestDto.Create request = new ContractRequestDto.Create();
        ReflectionTestUtils.setField(request, "contractStartDate", LocalDate.of(2026, 4, 1));
        ReflectionTestUtils.setField(request, "contractEndDate", LocalDate.of(2026, 9, 30));
        ReflectionTestUtils.setField(request, "jobDescription", "카페 홀 서빙 및 음료 제조");
        ReflectionTestUtils.setField(request, "workStartTime", LocalTime.of(9, 0));
        ReflectionTestUtils.setField(request, "workEndTime", LocalTime.of(18, 0));
        ReflectionTestUtils.setField(request, "breakStartTime", LocalTime.of(12, 0));
        ReflectionTestUtils.setField(request, "breakEndTime", LocalTime.of(13, 0));
        ReflectionTestUtils.setField(request, "workDaysPerWeek", 5);
        ReflectionTestUtils.setField(request, "weeklyHoliday", "일요일");
        ReflectionTestUtils.setField(request, "wageType", WageType.HOURLY);
        ReflectionTestUtils.setField(request, "wageAmount", 10320L);
        ReflectionTestUtils.setField(request, "hasBonus", false);
        ReflectionTestUtils.setField(request, "hasOtherAllowance", false);
        ReflectionTestUtils.setField(request, "payDayDescription", "매월 10일");
        ReflectionTestUtils.setField(request, "employmentInsurance", true);
        ReflectionTestUtils.setField(request, "industrialAccidentInsurance", true);
        ReflectionTestUtils.setField(request, "nationalPension", true);
        ReflectionTestUtils.setField(request, "healthInsurance", true);
        ReflectionTestUtils.setField(request, "contractDate", LocalDate.of(2026, 3, 23));
        ReflectionTestUtils.setField(request, "employeeAddress", "서울 서초구 서초동 456");
        return request;
    }

    private Contract createContract() {
        Contract contract = Contract.builder()
                .storeEmployee(storeEmployee)
                .contractStartDate(LocalDate.of(2026, 4, 1))
                .contractEndDate(LocalDate.of(2026, 9, 30))
                .workplace("서울 강남구 역삼동 123")
                .jobDescription("카페 홀 서빙")
                .workStartTime(LocalTime.of(9, 0))
                .workEndTime(LocalTime.of(18, 0))
                .breakStartTime(LocalTime.of(12, 0))
                .breakEndTime(LocalTime.of(13, 0))
                .workDaysPerWeek(5)
                .weeklyHoliday("일요일")
                .wageType(WageType.HOURLY)
                .wageAmount(10320L)
                .hasBonus(false)
                .hasOtherAllowance(false)
                .payDayDescription("매월 10일")
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .employmentInsurance(true)
                .industrialAccidentInsurance(true)
                .nationalPension(true)
                .healthInsurance(true)
                .contractDate(LocalDate.of(2026, 3, 23))
                .employeeAddress("서울 서초구 서초동 456")
                .build();
        ReflectionTestUtils.setField(contract, "id", 1000L);
        return contract;
    }

    @Nested
    @DisplayName("createContract")
    class CreateContract {

        @Test
        @DisplayName("성공 — workplace 미입력 시 매장 주소 자동 적용")
        void success_workplaceDefault() {
            ContractRequestDto.Create request = createRequest();
            // workplace를 null로 설정
            ReflectionTestUtils.setField(request, "workplace", null);

            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findByIdWithUser(100L)).willReturn(Optional.of(storeEmployee));
            given(contractRepository.existsOverlappingContract(anyLong(), any(), any())).willReturn(false);
            given(contractRepository.save(any(Contract.class))).willAnswer(invocation -> {
                Contract c = invocation.getArgument(0);
                ReflectionTestUtils.setField(c, "id", 1000L);
                return c;
            });

            ContractResponseDto.ContractDetail result = contractService.createContract(1L, 10L, 100L, request);

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("실패 — 다른 매장의 사장님이 계약서 생성 시 예외")
        void fail_notOwner() {
            ContractRequestDto.Create request = createRequest();
            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));

            assertThatThrownBy(() -> contractService.createContract(999L, 10L, 100L, request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_STORE_NOT_OWNED);
        }

        @Test
        @DisplayName("실패 — 퇴사 직원에 대한 계약 생성 시 예외")
        void fail_resignedEmployee() {
            ContractRequestDto.Create request = createRequest();
            storeEmployee.changeStatus(StoreEmployeeStatus.RESIGNED);

            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findByIdWithUser(100L)).willReturn(Optional.of(storeEmployee));

            assertThatThrownBy(() -> contractService.createContract(1L, 10L, 100L, request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_INVALID_EMPLOYEE);
        }

        @Test
        @DisplayName("실패 — 계약 종료일이 시작일보다 이전이면 예외")
        void fail_invalidDate() {
            ContractRequestDto.Create request = createRequest();
            ReflectionTestUtils.setField(request, "contractEndDate", LocalDate.of(2026, 3, 1));

            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findByIdWithUser(100L)).willReturn(Optional.of(storeEmployee));

            assertThatThrownBy(() -> contractService.createContract(1L, 10L, 100L, request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_INVALID_DATE);
        }

        @Test
        @DisplayName("실패 — 근무시간 역전 시 예외")
        void fail_invalidWorkTime() {
            ContractRequestDto.Create request = createRequest();
            ReflectionTestUtils.setField(request, "workStartTime", LocalTime.of(18, 0));
            ReflectionTestUtils.setField(request, "workEndTime", LocalTime.of(9, 0));

            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findByIdWithUser(100L)).willReturn(Optional.of(storeEmployee));

            assertThatThrownBy(() -> contractService.createContract(1L, 10L, 100L, request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_INVALID_WORK_TIME);
        }

        @Test
        @DisplayName("성공 — 휴게시간 null이면 정상 생성")
        void success_noBreakTime() {
            ContractRequestDto.Create request = createRequest();
            ReflectionTestUtils.setField(request, "breakStartTime", null);
            ReflectionTestUtils.setField(request, "breakEndTime", null);

            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findByIdWithUser(100L)).willReturn(Optional.of(storeEmployee));
            given(contractRepository.existsOverlappingContract(anyLong(), any(), any())).willReturn(false);
            given(contractRepository.save(any(Contract.class))).willAnswer(invocation -> {
                Contract c = invocation.getArgument(0);
                ReflectionTestUtils.setField(c, "id", 1000L);
                return c;
            });

            ContractResponseDto.ContractDetail result = contractService.createContract(1L, 10L, 100L, request);

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("실패 — 휴게시간 하나만 null이면 예외")
        void fail_partialBreakTime() {
            ContractRequestDto.Create request = createRequest();
            ReflectionTestUtils.setField(request, "breakStartTime", LocalTime.of(12, 0));
            ReflectionTestUtils.setField(request, "breakEndTime", null);

            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findByIdWithUser(100L)).willReturn(Optional.of(storeEmployee));

            assertThatThrownBy(() -> contractService.createContract(1L, 10L, 100L, request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_INVALID_WORK_TIME);
        }

        @Test
        @DisplayName("실패 — 중복 계약 기간 시 예외")
        void fail_overlappingContract() {
            ContractRequestDto.Create request = createRequest();

            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findByIdWithUser(100L)).willReturn(Optional.of(storeEmployee));
            given(contractRepository.existsOverlappingContract(anyLong(), any(), any())).willReturn(true);

            assertThatThrownBy(() -> contractService.createContract(1L, 10L, 100L, request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_PERIOD_OVERLAP);
        }

        @Test
        @DisplayName("성공 — paymentMethod는 항상 BANK_TRANSFER로 고정")
        void success_paymentMethodAlwaysBankTransfer() {
            ContractRequestDto.Create request = createRequest();

            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findByIdWithUser(100L)).willReturn(Optional.of(storeEmployee));
            given(contractRepository.existsOverlappingContract(anyLong(), any(), any())).willReturn(false);
            given(contractRepository.save(any(Contract.class))).willAnswer(invocation -> {
                Contract c = invocation.getArgument(0);
                ReflectionTestUtils.setField(c, "id", 1000L);
                return c;
            });

            contractService.createContract(1L, 10L, 100L, request);

            verify(contractRepository).save(any(Contract.class));
            // ArgumentCaptor를 통해 저장된 Contract의 paymentMethod 검증
            org.mockito.ArgumentCaptor<Contract> captor = org.mockito.ArgumentCaptor.forClass(Contract.class);
            verify(contractRepository).save(captor.capture());
            assertThat(captor.getValue().getPaymentMethod()).isEqualTo(PaymentMethod.BANK_TRANSFER);
        }

        @Test
        @DisplayName("실패 — 무기계약 존재 시 새 무기계약 생성 불가")
        void fail_duplicateOpenEndedContract() {
            ContractRequestDto.Create request = createRequest();
            ReflectionTestUtils.setField(request, "contractEndDate", null);

            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));
            given(storeEmployeeRepository.findByIdWithUser(100L)).willReturn(Optional.of(storeEmployee));
            given(contractRepository.existsOpenEndedContract(100L)).willReturn(true);

            assertThatThrownBy(() -> contractService.createContract(1L, 10L, 100L, request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_PERIOD_OVERLAP);
        }
    }

    @Nested
    @DisplayName("signByOwner")
    class SignByOwner {

        @BeforeEach
        void initSynchronization() {
            TransactionSynchronizationManager.initSynchronization();
        }

        @AfterEach
        void clearSynchronization() {
            TransactionSynchronizationManager.clearSynchronization();
        }

        @Test
        @DisplayName("성공 — 사장님 서명 후 PDF 생성 및 경로 업데이트")
        void success() {
            Contract contract = createContract();
            ContractRequestDto.Sign signRequest = new ContractRequestDto.Sign();
            ReflectionTestUtils.setField(signRequest, "signature", "data:image/png;base64,sig");

            given(storeRepository.findByIdAndIsClosedFalse(10L)).willReturn(Optional.of(store));
            given(contractRepository.findByIdAndStoreIdWithDetails(1000L, 10L)).willReturn(Optional.of(contract));
            given(contractPdfService.generatePdf(any(Contract.class))).willReturn("/path/to/pdf");

            ContractResponseDto.ContractDetail result = contractService.signByOwner(1L, 10L, 1000L, signRequest);

            assertThat(result).isNotNull();
            assertThat(contract.getStatus()).isEqualTo(ContractStatus.OWNER_SIGNED);
            assertThat(contract.getPdfFilePath()).isEqualTo("/path/to/pdf");
        }
    }

    @Nested
    @DisplayName("signByEmployee")
    class SignByEmployee {

        @BeforeEach
        void initSynchronization() {
            TransactionSynchronizationManager.initSynchronization();
        }

        @AfterEach
        void clearSynchronization() {
            TransactionSynchronizationManager.clearSynchronization();
        }

        @Test
        @DisplayName("성공 — 알바생 서명 후 COMPLETED 상태")
        void success() {
            Contract contract = createContract();
            contract.signByOwner("ownerSig");
            ContractRequestDto.Sign signRequest = new ContractRequestDto.Sign();
            ReflectionTestUtils.setField(signRequest, "signature", "data:image/png;base64,empSig");

            given(contractRepository.findByIdAndStoreIdWithDetails(1000L, 10L)).willReturn(Optional.of(contract));
            given(contractPdfService.generatePdf(any(Contract.class))).willReturn("/path/to/pdf");

            ContractResponseDto.ContractDetail result = contractService.signByEmployee(2L, 10L, 1000L, signRequest);

            assertThat(result).isNotNull();
            assertThat(contract.getStatus()).isEqualTo(ContractStatus.COMPLETED);
        }

        @Test
        @DisplayName("실패 — 다른 알바생이 서명 시도하면 예외")
        void fail_wrongEmployee() {
            Contract contract = createContract();
            contract.signByOwner("ownerSig");
            ContractRequestDto.Sign signRequest = new ContractRequestDto.Sign();
            ReflectionTestUtils.setField(signRequest, "signature", "sig");

            given(contractRepository.findByIdAndStoreIdWithDetails(1000L, 10L)).willReturn(Optional.of(contract));

            assertThatThrownBy(() -> contractService.signByEmployee(999L, 10L, 1000L, signRequest))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_ACCESS_DENIED);
        }
    }

    @Nested
    @DisplayName("getContract")
    class GetContract {

        @Test
        @DisplayName("성공 — 사장님이 계약서 조회")
        void success_owner() {
            Contract contract = createContract();
            given(contractRepository.findByIdAndStoreIdWithDetails(1000L, 10L)).willReturn(Optional.of(contract));

            ContractResponseDto.ContractDetail result = contractService.getContract(1L, 10L, 1000L);

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("성공 — 해당 알바생이 계약서 조회")
        void success_employee() {
            Contract contract = createContract();
            given(contractRepository.findByIdAndStoreIdWithDetails(1000L, 10L)).willReturn(Optional.of(contract));

            ContractResponseDto.ContractDetail result = contractService.getContract(2L, 10L, 1000L);

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("실패 — 무관한 사용자가 조회 시 예외")
        void fail_accessDenied() {
            Contract contract = createContract();
            given(contractRepository.findByIdAndStoreIdWithDetails(1000L, 10L)).willReturn(Optional.of(contract));

            assertThatThrownBy(() -> contractService.getContract(999L, 10L, 1000L))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_ACCESS_DENIED);
        }
    }

    @Nested
    @DisplayName("downloadContractPdf")
    class DownloadContractPdf {

        @Test
        @DisplayName("실패 — PDF 경로가 null이면 예외")
        void fail_noPdf() {
            Contract contract = createContract();
            given(contractRepository.findByIdAndStoreIdWithDetails(1000L, 10L)).willReturn(Optional.of(contract));

            assertThatThrownBy(() -> contractService.downloadContractPdf(1L, 10L, 1000L))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_PDF_NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("Sign DTO Validation")
    class SignDtoValidation {

        private Validator validator;

        @BeforeEach
        void setUp() {
            validator = Validation.buildDefaultValidatorFactory().getValidator();
        }

        @Test
        @DisplayName("실패 — 잘못된 서명 형식이면 검증 실패")
        void fail_invalidSignatureFormat() {
            ContractRequestDto.Sign signRequest = new ContractRequestDto.Sign();
            ReflectionTestUtils.setField(signRequest, "signature", "not-a-valid-base64-data-uri");

            Set<ConstraintViolation<ContractRequestDto.Sign>> violations = validator.validate(signRequest);
            assertThat(violations).isNotEmpty();
            assertThat(violations).anyMatch(v -> v.getMessage().contains("서명은 data:image"));
        }

        @Test
        @DisplayName("성공 — 올바른 Base64 data URI 형식이면 검증 통과")
        void success_validSignatureFormat() {
            ContractRequestDto.Sign signRequest = new ContractRequestDto.Sign();
            ReflectionTestUtils.setField(signRequest, "signature", "data:image/png;base64,iVBORw0KGgo=");

            Set<ConstraintViolation<ContractRequestDto.Sign>> violations = validator.validate(signRequest);
            assertThat(violations).isEmpty();
        }
    }
}
