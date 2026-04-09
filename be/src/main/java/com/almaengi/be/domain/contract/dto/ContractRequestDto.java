package com.almaengi.be.domain.contract.dto;

import com.almaengi.be.domain.contract.type.WageType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;

public class ContractRequestDto {

    @Getter
    public static class Create {

        // 근로계약기간
        @NotNull
        @Schema(description = "근로계약 시작일", example = "2026-04-01")
        private LocalDate contractStartDate;

        @Schema(description = "근로계약 종료일 (무기계약이면 null)", example = "2026-09-30")
        private LocalDate contractEndDate;

        // 근무장소
        @Schema(description = "근무장소 (미입력 시 매장 주소 자동 적용)", example = "서울 강남구 역삼동 123")
        private String workplace;

        // 업무의 내용
        @NotBlank
        @Schema(description = "업무의 내용", example = "카페 홀 서빙 및 음료 제조")
        private String jobDescription;

        // 소정근로시간
        @NotNull
        @Schema(description = "근무 시작 시간", example = "09:00")
        private LocalTime workStartTime;

        @NotNull
        @Schema(description = "근무 종료 시간", example = "18:00")
        private LocalTime workEndTime;

        // 휴게시간
        @Schema(description = "휴게 시작 시간 (없으면 null)", example = "12:00")
        private LocalTime breakStartTime;

        @Schema(description = "휴게 종료 시간 (없으면 null)", example = "13:00")
        private LocalTime breakEndTime;

        // 근무일/휴일
        @NotNull
        @Min(1)
        @Max(7)
        @Schema(description = "주당 근무일수", example = "5")
        private Integer workDaysPerWeek;

        @NotBlank
        @Size(max = 50)
        @Schema(description = "주휴일 (복수 가능)", example = "토요일, 일요일")
        private String weeklyHoliday;

        // 임금
        @NotNull
        @Schema(description = "임금 유형 (MONTHLY, DAILY, HOURLY)", example = "HOURLY")
        private WageType wageType;

        @NotNull
        @Min(0)
        @Schema(description = "임금 금액 (원)", example = "10320")
        private Long wageAmount;

        // 상여금
        @NotNull
        @Schema(description = "상여금 유무", example = "false")
        private Boolean hasBonus;

        @Schema(description = "상여금 금액 (원)", example = "0")
        private Long bonusAmount;

        // 기타급여
        @NotNull
        @Schema(description = "기타급여 유무", example = "false")
        private Boolean hasOtherAllowance;

        @Schema(description = "기타급여 상세 (항목별 금액 등)", example = "교통비 50000원")
        private String otherAllowanceDetails;

        // 임금지급일
        @NotBlank
        @Schema(description = "임금지급일 설명", example = "매월 10일")
        private String payDayDescription;

        // 사회보험
        @NotNull
        @Schema(description = "고용보험 적용 여부", example = "true")
        private Boolean employmentInsurance;

        @NotNull
        @Schema(description = "산재보험 적용 여부", example = "true")
        private Boolean industrialAccidentInsurance;

        @NotNull
        @Schema(description = "국민연금 적용 여부", example = "true")
        private Boolean nationalPension;

        @NotNull
        @Schema(description = "건강보험 적용 여부", example = "true")
        private Boolean healthInsurance;

        // 계약일자
        @NotNull
        @Schema(description = "계약 체결일", example = "2026-03-23")
        private LocalDate contractDate;

        // 근로자 주소
        @NotBlank
        @Schema(description = "근로자 주소", example = "서울 서초구 서초동 456")
        private String employeeAddress;
    }

    @Getter
    public static class Sign {

        @NotBlank
        @Size(max = 500000, message = "서명 데이터는 500KB를 초과할 수 없습니다.")
        @Pattern(regexp = "^data:image/(png|jpeg|jpg);base64,.+$",
                message = "서명은 data:image/(png|jpeg|jpg);base64 형식이어야 합니다.")
        @Schema(description = "Base64 인코딩된 서명 이미지", example = "data:image/png;base64,iVBOR...")
        private String signature;
    }
}
