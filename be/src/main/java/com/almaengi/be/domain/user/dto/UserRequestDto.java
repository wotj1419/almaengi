package com.almaengi.be.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

/**
 * 사용자 관련 요청 DTO 모음
 */
public class UserRequestDto {

    /**
     * 계좌 생성 요청 DTO
     * 사용자가 원하는 은행의 bankCode만 전달하면 내부적으로 상품 조회 + 계좌 생성을 처리합니다.
     */
    @Getter
    public static class CreateAccount {
        @Schema(description = "은행코드 (GET /api/v1/finance/banks 에서 조회 가능)", example = "001")
        @NotBlank(message = "은행코드는 필수입니다.")
        private String bankCode;
    }
}
