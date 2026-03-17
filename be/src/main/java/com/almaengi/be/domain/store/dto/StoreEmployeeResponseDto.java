package com.almaengi.be.domain.store.dto;

import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.store.type.TaxType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

public class StoreEmployeeResponseDto {

    @Schema(description = "초대 코드 발급 응답 DTO")
    @Getter
    @Builder
    public static class InviteCodeInfo {
        @Schema(description = "발급된 6자리 초대 코드", example = "A1B2C3")
        private String inviteCode;
        @Schema(description = "만료일시 (발급 후 24시간 등)", example = "2023-12-31T23:59:59")
        private String expiredAt;
    }

    @Schema(description = "매장 직원 정보 응답 DTO")
    @Getter
    @Builder
    public static class EmployeeInfo {
        @Schema(description = "직원(연결) ID", example = "1")
        private Long employeeId;
        @Schema(description = "유저 ID (본계정 ID)", example = "10")
        private Long userId;
        @Schema(description = "직원 이름", example = "김알바")
        private String name;
        @Schema(description = "직급/직책", example = "평일 오전 알바")
        private String position;
        @Schema(description = "시급", example = "10320")
        private Integer hourlyWage;
        @Schema(description = "세금 처리 유형", example = "FOUR_INSURANCE")
        private TaxType taxType;
        @Schema(description = "주휴수당 포함 여부", example = "false")
        private Boolean includeHolidayPay;
        @Schema(description = "최초 입사일 (합류일)", example = "2023-11-01")
        private LocalDate hireDate;
        @Schema(description = "현재 상태", example = "WORKING")
        private StoreEmployeeStatus status;

        public static EmployeeInfo from(StoreEmployee employee) {
            return EmployeeInfo.builder()
                    .employeeId(employee.getId())
                    .userId(employee.getUser().getId())
                    .name(employee.getUser().getName())
                    .position(employee.getPosition())
                    .hourlyWage(employee.getHourlyWage())
                    .taxType(employee.getTaxType())
                    .includeHolidayPay(employee.getIncludeHolidayPay())
                    .hireDate(employee.getHireDate())
                    .status(employee.getStatus())
                    .build();
        }
    }
}
