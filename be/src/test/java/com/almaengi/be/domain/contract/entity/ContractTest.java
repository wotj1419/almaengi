package com.almaengi.be.domain.contract.entity;

import com.almaengi.be.domain.contract.type.ContractStatus;
import com.almaengi.be.domain.contract.type.PaymentMethod;
import com.almaengi.be.domain.contract.type.WageType;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ContractTest {

    private Contract createDraftContract() {
        return Contract.builder()
                .contractStartDate(LocalDate.of(2026, 4, 1))
                .contractEndDate(LocalDate.of(2026, 9, 30))
                .workplace("서울 강남구 역삼동")
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
                .employeeAddress("서울 서초구 서초동")
                .build();
    }

    @Test
    @DisplayName("Contract 생성 시 초기 상태는 DRAFT")
    void create_initialStatus_isDraft() {
        Contract contract = createDraftContract();
        assertThat(contract.getStatus()).isEqualTo(ContractStatus.DRAFT);
    }

    @Nested
    @DisplayName("signByOwner")
    class SignByOwner {

        @Test
        @DisplayName("DRAFT 상태에서 사장님 서명 성공 → OWNER_SIGNED")
        void success() {
            Contract contract = createDraftContract();

            contract.signByOwner("data:image/png;base64,ownerSig");

            assertThat(contract.getStatus()).isEqualTo(ContractStatus.OWNER_SIGNED);
            assertThat(contract.getOwnerSignature()).isEqualTo("data:image/png;base64,ownerSig");
            assertThat(contract.getOwnerSignedAt()).isNotNull();
        }

        @Test
        @DisplayName("OWNER_SIGNED 상태에서 사장님 재서명 시 예외")
        void fail_alreadySigned() {
            Contract contract = createDraftContract();
            contract.signByOwner("sig1");

            assertThatThrownBy(() -> contract.signByOwner("sig2"))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_INVALID_STATUS);
        }

        @Test
        @DisplayName("COMPLETED 상태에서 사장님 서명 시 예외")
        void fail_completed() {
            Contract contract = createDraftContract();
            contract.signByOwner("ownerSig");
            contract.signByEmployee("employeeSig");

            assertThatThrownBy(() -> contract.signByOwner("newSig"))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_INVALID_STATUS);
        }
    }

    @Nested
    @DisplayName("signByEmployee")
    class SignByEmployee {

        @Test
        @DisplayName("OWNER_SIGNED 상태에서 알바생 서명 성공 → COMPLETED")
        void success() {
            Contract contract = createDraftContract();
            contract.signByOwner("ownerSig");

            contract.signByEmployee("data:image/png;base64,empSig");

            assertThat(contract.getStatus()).isEqualTo(ContractStatus.COMPLETED);
            assertThat(contract.getEmployeeSignature()).isEqualTo("data:image/png;base64,empSig");
            assertThat(contract.getEmployeeSignedAt()).isNotNull();
        }

        @Test
        @DisplayName("DRAFT 상태에서 알바생 서명 시 예외 (사장님 먼저 서명해야 함)")
        void fail_draftStatus() {
            Contract contract = createDraftContract();

            assertThatThrownBy(() -> contract.signByEmployee("empSig"))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_INVALID_STATUS);
        }

        @Test
        @DisplayName("COMPLETED 상태에서 알바생 재서명 시 예외")
        void fail_completed() {
            Contract contract = createDraftContract();
            contract.signByOwner("ownerSig");
            contract.signByEmployee("empSig");

            assertThatThrownBy(() -> contract.signByEmployee("newSig"))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .isEqualTo(ErrorCode.CONTRACT_INVALID_STATUS);
        }
    }

    @Test
    @DisplayName("updatePdfFilePath — PDF 경로가 정상 업데이트된다")
    void updatePdfFilePath() {
        Contract contract = createDraftContract();

        contract.updatePdfFilePath("/home/ubuntu/documents/1/contract/1.pdf");

        assertThat(contract.getPdfFilePath()).isEqualTo("/home/ubuntu/documents/1/contract/1.pdf");
    }
}
