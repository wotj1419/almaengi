package com.almaengi.be.domain.finance.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

/**
 * 금융망 API 응답 DTO 모음
 */
public class FinanceResponseDto {

    /**
     * 은행코드 조회 응답
     */
    @Getter
    @Builder
    public static class BankCode {
        @Schema(description = "은행코드", example = "001")
        private String bankCode;

        @Schema(description = "은행명", example = "한국은행")
        private String bankName;
    }

    /**
     * 거래내역 조회 응답
     */
    @Getter
    @Builder
    public static class TransactionHistory {
        @Schema(description = "거래일자", example = "20240401")
        private String transactionDate;

        @Schema(description = "거래시각", example = "102447")
        private String transactionTime;

        @Schema(description = "거래유형 (1:입금, 2:출금)", example = "1")
        private String transactionType;

        @Schema(description = "거래유형명", example = "입금(이체)")
        private String transactionTypeName;

        @Schema(description = "거래금액", example = "100000")
        private String transactionBalance;

        @Schema(description = "거래후잔액", example = "99900000")
        private String transactionAfterBalance;

        @Schema(description = "거래요약 (매장명, 급여 등)", example = "알마엥이카페 3월 급여")
        private String transactionSummary;

        @Schema(description = "거래메모", example = "")
        private String transactionMemo;

        /**
         * 금융망 API 응답 Map을 DTO로 변환합니다.
         */
        public static TransactionHistory from(Map<String, String> map) {
            return TransactionHistory.builder()
                    .transactionDate(map.get("transactionDate"))
                    .transactionTime(map.get("transactionTime"))
                    .transactionType(map.get("transactionType"))
                    .transactionTypeName(map.get("transactionTypeName"))
                    .transactionBalance(map.get("transactionBalance"))
                    .transactionAfterBalance(map.get("transactionAfterBalance"))
                    .transactionSummary(map.get("transactionSummary"))
                    .transactionMemo(map.get("transactionMemo"))
                    .build();
        }
    }
}
