package com.almaengi.be.domain.store.dto;

import com.almaengi.be.domain.store.type.TaxType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

public class StoreEmployeeRequestDto {

    @Schema(description = "알바생 매장 합류(가입) 요청 DTO")
    @Getter
    public static class Join {
        @Schema(description = "사장님에게 전달받은 6자리 초대 코드", example = "A1B2C3")
        @NotBlank(message = "초대 코드를 입력해주세요")
        private String inviteCode;
    }

    @Schema(name = "StoreEmployeeUpdate", description = "매장 직원 정보 수정 요청 DTO (사장님용)")
    @Getter
    public static class Update {
        @Schema(description = "직원 직급/직책 (예: 평일 오전 알바)", example = "평일 오전 알바")
        private String position;
        @Schema(description = "시급", example = "10320")
        private Integer hourlyWage;
        @Schema(description = "세금 처리 유형", example = "FOUR_INSURANCE")
        private TaxType taxType;
        @Schema(description = "주휴수당 포함 여부", example = "true")
        private Boolean includeHolidayPay;
    }
}
