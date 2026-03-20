package com.almaengi.be.domain.payroll.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

public class PayrollRequestDto {

    @Getter
    public static class Generate {
        @NotBlank(message = "정산 대상 월은 필수입니다.")
        @Schema(description = "정산 대상 월 (yyyy-MM)", example = "2026-03")
        private String targetMonth;
    }
}
