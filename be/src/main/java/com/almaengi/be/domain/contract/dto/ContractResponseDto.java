package com.almaengi.be.domain.contract.dto;

import com.almaengi.be.domain.contract.entity.Contract;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.user.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class ContractResponseDto {

    @Getter
    @Builder
    public static class ContractDetail {

        @Schema(description = "계약서 ID")
        private Long contractId;

        @Schema(description = "매장 직원 ID")
        private Long storeEmployeeId;

        // 사업주 정보 (자동 채움)
        @Schema(description = "사업주(대표자) 이름")
        private String employerName;

        @Schema(description = "사업체명")
        private String storeName;

        @Schema(description = "사업체 주소")
        private String storeAddress;

        @Schema(description = "사업체 전화번호")
        private String storePhone;

        // 근로자 정보
        @Schema(description = "근로자 이름")
        private String employeeName;

        @Schema(description = "근로자 연락처")
        private String employeePhone;

        @Schema(description = "근로자 주소")
        private String employeeAddress;

        // 계약 내용
        @Schema(description = "근로계약 시작일")
        private LocalDate contractStartDate;

        @Schema(description = "근로계약 종료일")
        private LocalDate contractEndDate;

        @Schema(description = "근무장소")
        private String workplace;

        @Schema(description = "업무의 내용")
        private String jobDescription;

        @Schema(description = "근무 시작 시간")
        private LocalTime workStartTime;

        @Schema(description = "근무 종료 시간")
        private LocalTime workEndTime;

        @Schema(description = "휴게 시작 시간")
        private LocalTime breakStartTime;

        @Schema(description = "휴게 종료 시간")
        private LocalTime breakEndTime;

        @Schema(description = "주당 근무일수")
        private Integer workDaysPerWeek;

        @Schema(description = "주휴일 요일")
        private String weeklyHoliday;

        @Schema(description = "임금 유형")
        private String wageType;

        @Schema(description = "임금 금액")
        private Long wageAmount;

        @Schema(description = "상여금 유무")
        private Boolean hasBonus;

        @Schema(description = "상여금 금액")
        private Long bonusAmount;

        @Schema(description = "기타급여 유무")
        private Boolean hasOtherAllowance;

        @Schema(description = "기타급여 상세")
        private String otherAllowanceDetails;

        @Schema(description = "임금지급일")
        private String payDayDescription;

        @Schema(description = "지급방법")
        private String paymentMethod;

        @Schema(description = "고용보험")
        private Boolean employmentInsurance;

        @Schema(description = "산재보험")
        private Boolean industrialAccidentInsurance;

        @Schema(description = "국민연금")
        private Boolean nationalPension;

        @Schema(description = "건강보험")
        private Boolean healthInsurance;

        @Schema(description = "계약 체결일")
        private LocalDate contractDate;

        // 상태 및 서명
        @Schema(description = "계약 상태")
        private String status;

        @Schema(description = "사장님 서명 완료 여부")
        private Boolean ownerSigned;

        @Schema(description = "사장님 서명 시각")
        private LocalDateTime ownerSignedAt;

        @Schema(description = "알바생 서명 완료 여부")
        private Boolean employeeSigned;

        @Schema(description = "알바생 서명 시각")
        private LocalDateTime employeeSignedAt;

        @Schema(description = "생성일시")
        private LocalDateTime createdAt;

        public static ContractDetail from(Contract contract) {
            StoreEmployee se = contract.getStoreEmployee();
            Store store = se.getStore();
            User owner = store.getOwner();
            User employee = se.getUser();

            return ContractDetail.builder()
                    .contractId(contract.getId())
                    .storeEmployeeId(se.getId())
                    .employerName(owner.getName())
                    .storeName(store.getName())
                    .storeAddress(store.getAddress())
                    .storePhone(store.getPhone())
                    .employeeName(employee.getName())
                    .employeePhone(employee.getPhone())
                    .employeeAddress(contract.getEmployeeAddress())
                    .contractStartDate(contract.getContractStartDate())
                    .contractEndDate(contract.getContractEndDate())
                    .workplace(contract.getWorkplace())
                    .jobDescription(contract.getJobDescription())
                    .workStartTime(contract.getWorkStartTime())
                    .workEndTime(contract.getWorkEndTime())
                    .breakStartTime(contract.getBreakStartTime())
                    .breakEndTime(contract.getBreakEndTime())
                    .workDaysPerWeek(contract.getWorkDaysPerWeek())
                    .weeklyHoliday(contract.getWeeklyHoliday())
                    .wageType(contract.getWageType().name())
                    .wageAmount(contract.getWageAmount())
                    .hasBonus(contract.getHasBonus())
                    .bonusAmount(contract.getBonusAmount())
                    .hasOtherAllowance(contract.getHasOtherAllowance())
                    .otherAllowanceDetails(contract.getOtherAllowanceDetails())
                    .payDayDescription(contract.getPayDayDescription())
                    .paymentMethod(contract.getPaymentMethod().name())
                    .employmentInsurance(contract.getEmploymentInsurance())
                    .industrialAccidentInsurance(contract.getIndustrialAccidentInsurance())
                    .nationalPension(contract.getNationalPension())
                    .healthInsurance(contract.getHealthInsurance())
                    .contractDate(contract.getContractDate())
                    .status(contract.getStatus().name())
                    .ownerSigned(contract.getOwnerSignature() != null)
                    .ownerSignedAt(contract.getOwnerSignedAt())
                    .employeeSigned(contract.getEmployeeSignature() != null)
                    .employeeSignedAt(contract.getEmployeeSignedAt())
                    .createdAt(contract.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class ContractSummary {

        @Schema(description = "계약서 ID")
        private Long contractId;

        @Schema(description = "근로자 이름")
        private String employeeName;

        @Schema(description = "계약 상태")
        private String status;

        @Schema(description = "계약 체결일")
        private LocalDate contractDate;

        @Schema(description = "근로계약 시작일")
        private LocalDate contractStartDate;

        @Schema(description = "근로계약 종료일")
        private LocalDate contractEndDate;

        @Schema(description = "생성일시")
        private LocalDateTime createdAt;

        public static ContractSummary from(Contract contract) {
            return ContractSummary.builder()
                    .contractId(contract.getId())
                    .employeeName(contract.getStoreEmployee().getUser().getName())
                    .status(contract.getStatus().name())
                    .contractDate(contract.getContractDate())
                    .contractStartDate(contract.getContractStartDate())
                    .contractEndDate(contract.getContractEndDate())
                    .createdAt(contract.getCreatedAt())
                    .build();
        }
    }
}
