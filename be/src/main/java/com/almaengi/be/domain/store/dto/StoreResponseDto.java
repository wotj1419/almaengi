package com.almaengi.be.domain.store.dto;

import com.almaengi.be.domain.store.entity.Store;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

public class StoreResponseDto {

    @Schema(description = "매장 정보 응답 DTO")
    @Getter
    @Builder
    public static class StoreInfo {
        @Schema(description = "매장 식별 ID", example = "1")
        private Long storeId;
        @Schema(description = "매장 이름", example = "알맹이 카페")
        private String storeName;
        @Schema(description = "매장 상세 주소", example = "서울시 강남구 테헤란로 123")
        private String address;
        @Schema(description = "매장 연락처", example = "02-1234-5678")
        private String phone;
        @Schema(description = "출퇴근용 QR 코드 URL", example = "http://example.com/qr/1")
        private String qrCode;
        @Schema(description = "상시 근로자 5인 이상 여부", example = "false")
        private Boolean isOver5Employees;

        public static StoreInfo from(Store store) {
            return StoreInfo.builder()
                    .storeId(store.getId())
                    .storeName(store.getName())
                    .address(store.getAddress())
                    .phone(store.getPhone())
                    .qrCode(store.getQrCode())
                    .isOver5Employees(store.getIsOver5Employees())
                    .build();
        }
    }
}
