package com.almaengi.be.domain.auction.entity;

import com.almaengi.be.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.auction.type.AuctionStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * 대타 스케줄 경매 (Shift_Auctions) 테이블과 매핑되는 엔티티입니다.
 * 사장님이 구인난이 있는 스케줄을 매물로 등록하는 본체입니다.
 */
@Entity
@Table(name = "shift_auctions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShiftAuction extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "auction_id")
    private Long id;

    // 매장(Store) 연관관계 매핑 (단방향)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate; // 예: 2026-03-10

    @Column(name = "start_time", nullable = false)
    private LocalTime targetStartTime; // 예: 18:00

    @Column(name = "end_time", nullable = false)
    private LocalTime targetEndTime; // 예: 24:00 (또는 23:59)

    @Column(name = "deadline", nullable = false)
    private LocalDateTime deadline; // 경매 마감 일시

    /**
     * 입찰 가격이 내려갈 수 있는 한계점 (사장님 설정 하한가).
     * 미입력 시 법정 최저시급이 적용되며, 사장님이 직접 입력 시 항상 법정 최저시급 이상이어야 합니다.
     */
    @Column(name = "min_wage", nullable = false)
    private Integer minWage;

    /**
     * 사장님이 설정하는 상한가 (최대 시급 제한)
     */
    @Column(name = "max_wage", nullable = false)
    private Integer maxWage;

    /**
     * 모집할 인원 수 (다중 선택 지원)
     */
    @Column(name = "recruit_count", nullable = false)
    private Integer recruitCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private AuctionStatus status;

    @Builder
    public ShiftAuction(Store store, LocalDate targetDate, LocalTime targetStartTime, LocalTime targetEndTime,
            LocalDateTime deadline, Integer minWage, Integer maxWage, Integer recruitCount) {
        this.store = store;
        this.targetDate = targetDate;
        this.targetStartTime = targetStartTime;
        this.targetEndTime = targetEndTime;
        this.deadline = deadline;
        this.minWage = minWage;
        this.maxWage = maxWage;
        this.recruitCount = recruitCount;
        this.status = AuctionStatus.IN_PROGRESS; // 생성 시 기본 상태
    }

    /**
     * 비즈니스 로직: 낙찰 확정 시 경매 상태를 마감으로 변경하는 메서드.
     * 낙찰자 데이터는 AuctionWinner 엔티티로 별도 관리됩니다.
     */
    public void closeAuction() {
        this.status = AuctionStatus.CLOSED;
    }
    // 낙찰 없이 경매 중단
    public void cancelAuction() { this.status = AuctionStatus.CANCELLED; }

    // 진행 중인 경매의 조건을 수정합니다.
    public void updateAuctionInfo(LocalDate targetDate,
                                  LocalTime targetStartTime,
                                  LocalTime targetEndTime,
                                  LocalDateTime deadline,
                                  Integer minWage,
                                  Integer maxWage,
                                  Integer recruitCount) {
        this.targetDate = targetDate;
        this.targetStartTime = targetStartTime;
        this.targetEndTime = targetEndTime;
        this.deadline = deadline;
        this.minWage = minWage;
        this.maxWage = maxWage;
        this.recruitCount = recruitCount;
    }
}
