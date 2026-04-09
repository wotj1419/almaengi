package com.almaengi.be.domain.auction.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Setter;

/**
 * 대타 스케줄 경매와 통신하기 위한 요청 시 DTO 모음입니다.
 */
public class AuctionRequestDto {

    /**
     * 사장님이 새로운 경매(대타 구인)를 등록할 때 사용하는 요청 DTO.
     */
    @Schema(description = "사장님이 새로운 경매(대타 구인)를 등록할 때 사용하는 요청 DTO")
    @Getter
    public static class Register {
        @Schema(description = "대타를 구할 날짜 (YYYY-MM-DD)", example = "2026-03-20")
        private LocalDate targetDate;

        @Schema(description = "대타 근무 시작 시간 (HH:mm)", type = "string", example = "18:00")
        private LocalTime targetStartTime;

        @Schema(description = "대타 근무 종료 시간 (HH:mm)", type = "string", example = "23:59")
        private LocalTime targetEndTime;

        @Schema(description = "경매 입찰이 마감되는 일시", type = "string", example = "2026-03-19T18:00:00")
        private LocalDateTime deadline;

        @Schema(description = "사장님이 제시하는 하한가(선택). 미입력시 법정 최저시급(10320) 적용", example = "10320", nullable = true)
        private Integer minWage;

        @Schema(description = "사장님이 제시하는 상한가 한계치", example = "15000")
        private Integer maxWage;

        @Schema(description = "대타 모집 필요 인원 수", example = "1")
        private Integer recruitCount;
    }

    /**
     * 알바생이 특정 경매에 희망 시급을 입찰할 때 사용하는 요청 DTO.
     */
    @Schema(description = "알바생이 특정 경매에 희망 시급을 입찰할 때 사용하는 요청 DTO")
    @Getter
    public static class Bid {
        @Schema(description = "본인이 제안하는 희망 시급 (minWage ~ maxWage 범위 내)", example = "12000")
        private Integer bidWage;
    }

    /**
     * 사장님이 지원자 목록 중 낙찰 대상을 선택하여 경매를 마감할 때 사용하는 요청 DTO.
     */
    @Schema(description = "사장님이 지원자 목록 중 낙찰 대상을 선택하여 경매를 마감할 때 사용하는 요청 DTO")
    @Getter
    public static class Close {
        @Schema(description = "사장님이 선택한 최종 낙찰자들의 지원서(AuctionBid) ID 목록", example = "[10, 15]")
        private List<Long> selectedBidIds;
    }

    /**
     * 사장님이 진행 중 경매 정보를 수정할 때 사용하는 요청 DTO.
     * (필드 구조는 등록과 동일)
     */
    @Schema(description = "사장님이 진행 중 경매 정보를 수정할 때 사용하는 요청 DTO")
    @Getter
    public static class Update {
        @Schema(description = "대타를 구할 날짜 (YYYY-MM-DD)", example = "2026-03-20")
        private LocalDate targetDate;
        @Schema(description = "대타 근무 시작 시간 (HH:mm)", type = "string", example = "18:00")
        private LocalTime targetStartTime;
        @Schema(description = "대타 근무 종료 시간 (HH:mm)", type = "string", example = "23:59")
        private LocalTime targetEndTime;
        @Schema(description = "경매 입찰이 마감되는 일시", type = "string", example = "2026-03-19T18:00:00")
        private LocalDateTime deadline;
        @Schema(description = "사장님이 제시하는 하한가(선택). 미입력시 법정 최저시급 적용", example = "10320", nullable = true)
        private Integer minWage;
        @Schema(description = "사장님이 제시하는 상한가 한계치", example = "15000")
        private Integer maxWage;
        @Schema(description = "대타 모집 필요 인원 수", example = "1")
        private Integer recruitCount;
    }
    @Schema(description = "경매 인사이트 리포트 조회용 Query DTO")
    @Getter @Setter
    public static class AuctionInsightsQuery {
        @Schema(description = "조회 월 (yyyy-MM, 현재 월 이전만 가능)", example = "2026-03")
        @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "yearMonth 형식은 yyyy-MM 이어야 합니다.")
        private String yearMonth;

        @Schema(description = "페이지 번호 (0부터 시작)", example = "0", defaultValue = "0")
        @Min(value = 0, message = "page는 0 이상이어야 합니다.")
        private Integer page = 0;

        @Schema(description = "페이지 크기", example = "10", defaultValue = "10")
        @Min(value = 1, message = "size는 1 이상이어야 합니다.")
        @Max(value = 100, message = "size는 100 이하여야 합니다.")
        private Integer size = 10;

        public int normalizedPage() { return page == null ? 0 : page; }
        public int normalizedSize() { return size == null ? 10 : size; }
    }
}
