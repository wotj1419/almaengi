package com.almaengi.be.domain.store.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

public class StoreRequestDto {

    @Schema(description = "매장 생성을 위한 요청 DTO")
    @Getter
    public static class Create {

        @Schema(description = "매장 이름", example = "알맹이 카페")
        @NotBlank(message = "매장 이름은 필수 입니다.")
        private String storeName;

        @Schema(description = "매장 상세 주소", example = "서울시 강남구 테헤란로 123")
        @NotBlank(message = "매장 주소는 필수 입니다.")
        private String address;

        @Schema(description = "매장 연락처", example = "02-1234-5678")
        private String phone;
        @Schema(description = "상시 근로자 5인 이상 여부", example = "false")
        private Boolean isOver5Employees;
    }

    @Schema(description = "매장 수정을 위한 요청 DTO")
    @Getter
    public static class Update {
        @Schema(description = "수정할 매장 이름", example = "알맹이 카페 본점")
        @NotBlank(message = "매장 이름은 필수입니다.")
        private String storeName;

        @Schema(description = "수정할 매장 상세 주소", example = "서울시 강남구 테헤란로 456")
        @NotBlank(message = "매장 주소는 필수 입니다.")
        private String address;

        @Schema(description = "수정할 매장 연락처", example = "02-9876-5432")
        private String phone;
        @Schema(description = "상시 근로자 5인 이상 여부", example = "true")
        private Boolean isOver5Employees;
    }
}
