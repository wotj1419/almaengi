package com.almaengi.be.domain.auction.dto;

import com.almaengi.be.domain.auction.entity.ShiftAuction;
import com.almaengi.be.domain.auction.type.AuctionStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 경매 목록이나 상세 조회 시 클라이언트(프론트엔드)로 반환하는 응답 DTO입니다.
 */
public class AuctionResponseDto {

    @Schema(description = "대타 경매의 기본 정보를 나타내는 응답 DTO")
    @Getter
    @Builder
    public static class Auction {
        @Schema(description = "경매 식별 ID", example = "100")
        private Long auctionId;
        @Schema(description = "매장 식별 ID", example = "1")
        private Long storeId;
        @Schema(description = "대타 근무 날짜", example = "2026-03-20")
        private LocalDate targetDate;
        @Schema(description = "대타 근무 시작 시간", type = "string", example = "18:00")
        private LocalTime targetStartTime;
        @Schema(description = "대타 근무 종료 시간", type = "string", example = "23:59")
        private LocalTime targetEndTime;
        @Schema(description = "입찰 마감 일시", type = "string", example = "2026-03-19T18:00:00")
        private LocalDateTime deadline;
        @Schema(description = "사장님이 제시한 하한가", example = "10320")
        private Integer minWage;
        @Schema(description = "사장님이 제시한 상한가", example = "15000")
        private Integer maxWage;
        @Schema(description = "모집 대상 인원 수", example = "2")
        private Integer recruitCount;
        @Schema(description = "경매 진행 상태 (IN_PROGRESS, CLOSED 등)", example = "IN_PROGRESS")
        private AuctionStatus status;
        @Schema(description = "다중 낙찰된 알바생들의 Entity ID 목록", example = "[3, 7]")
        private List<Long> winnerIds;

        @Schema(description = "경매 등록 일시", type = "string", example = "2026-03-01T10:00:00")
        private LocalDateTime createdAt;

        // Entity -> DTO 변환 편의 로직 (현재 엔티티 참조만으로는 winner 목록을 가져올 수 없으므로, 명시적으로 주입받거나 서비스
        // 단에서 세팅하도록 변경)
        public static Auction from(ShiftAuction entity, List<Long> winnerIds) {
            return Auction.builder()
                    .auctionId(entity.getId())
                    .storeId(entity.getStore().getId())
                    .targetDate(entity.getTargetDate())
                    .targetStartTime(entity.getTargetStartTime())
                    .targetEndTime(entity.getTargetEndTime())
                    .deadline(entity.getDeadline())
                    .minWage(entity.getMinWage())
                    .maxWage(entity.getMaxWage())
                    .recruitCount(entity.getRecruitCount())
                    .status(entity.getStatus())
                    .winnerIds(winnerIds)
                    .createdAt(entity.getCreatedAt())
                    .build();
        }
    }

    @Schema(description = "특정 경매 단일 건의 상세 정보 응답 DTO")
    @Getter
    @Builder
    public static class Detail {
        @Schema(description = "기본 경매 정보")
        private Auction auction;
        @Schema(description = "지원자 전체 내역 (알바생 권한 조회 시 null)")
        private Bidders bidders;
    }

    /**
     * 특정 경매의 지원자 목록을 사장님 UI에 맞추어(3그룹 분류 및 태그 포함) 반환하는 DTO입니다.
     */
    @Schema(description = "주휴수당 발생 여부에 따라 3그룹으로 분류된 전체 지원자 목록")
    @Getter
    @Builder
    public static class Bidders {
        @Schema(description = "기존에 이미 주휴수당을 받고 있던 알바생 그룹")
        private List<BidderInfo> group1;
        @Schema(description = "낙찰 시 주휴수당 발생 대상 구간으로 진입하는 알바생 그룹")
        private List<BidderInfo> group2;
        @Schema(description = "주휴수당 여부와 무관한 알바생 그룹 (주 근로시간 미달)")
        private List<BidderInfo> group3;
    }

    @Schema(description = "사장님 UI에 표시되는 개별 지원자(알바생)의 상세 스펙 정보")
    @Getter
    @Builder
    public static class BidderInfo {
        @Schema(description = "지원서(AuctionBid) ID", example = "10")
        private Long bidId;
        @Schema(description = "지원자(알바생) StoreEmployee ID", example = "2")
        private Long employeeId;
        @Schema(description = "지원자 이름", example = "김알바")
        private String applicantName;
        @Schema(description = "알바생이 제시한 희망 시급", example = "12000")
        private Integer proposedWage;
        @Schema(description = "해당 알바생의 요약 태그 리스트", example = "[\"근속 2년\", \"결근 0회\"]")
        private List<String> tags;
        @Schema(description = "경매 입찰 시간", type = "string", example = "2026-03-18T12:05:00")
        private LocalDateTime bidTime;
    }

    @Schema(description = "경매 마감(낙찰 확정) 결과 응답 DTO")
    @Getter
    @Builder
    public static class CloseResult {
        @Schema(description = "경매 식별 ID", example = "100")
        private Long auctionId;
        @Schema(description = "마감 후 경매 상태", example = "CLOSED")
        private AuctionStatus status;
        @Schema(description = "최종 낙찰 직원 목록")
        private List<ClosedWinner> winners;
    }

    @Schema(description = "경매 마감 결과의 낙찰 직원 정보")
    @Getter
    @Builder
    public static class ClosedWinner {
        @Schema(description = "선정된 입찰 ID", example = "10")
        private Long bidId;
        @Schema(description = "낙찰 직원(StoreEmployee) ID", example = "2")
        private Long employeeId;
        @Schema(description = "낙찰 직원 이름", example = "김직원")
        private String employeeName;
        @Schema(description = "낙찰 시급", example = "12500")
        private Integer bidWage;
    }

    @Schema(description = "경매 인사이트 리포트 단일 응답 DTO")
    @Getter
    @Builder
    public static class InsightsReport {
        @Schema(description = "조회 월 (yyyy-MM)", example = "2026-03")
        private String yearMonth;
        @Schema(description = "해당 월 경매 생성 건수", example = "16")
        private long totalAuctionCount;
        @Schema(description = "해당 월 낙찰된 경매 건수", example = "12")
        private long closedAuctionCount;
        @Schema(description = "낙찰률 (%)", example = "75.0")
        private BigDecimal successRate;
        @Schema(description = "평균 낙찰 시급", example = "12450")
        private Integer averageWinningWage;
        @Schema(description = "요일/시간대 집계 페이지")
        private TimelinePage timelinePage;
    }

    @Schema(description = "요일/시간대 집계 페이지 DTO")
    @Getter
    @Builder
    public static class TimelinePage {
        private List<TimelineItem> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean hasNext;
    }

    @Schema(description = "요일 + 시간대 집계 아이템")
    @Getter
    @Builder
    public static class TimelineItem {
        @Schema(description = "요일", example = "MON")
        private String dayOfWeek;
        @Schema(description = "근무 시작 시간", type = "string", example = "18:00:00")
        private LocalTime startTime;
        @Schema(description = "근무 종료 시간", type = "string", example = "22:00:00")
        private LocalTime endTime;
        @Schema(description = "해당 요일/시간대 경매 건수", example = "3")
        private long auctionCount;
    }
}
