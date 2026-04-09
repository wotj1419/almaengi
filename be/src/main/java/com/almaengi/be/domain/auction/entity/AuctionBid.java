package com.almaengi.be.domain.auction.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.almaengi.be.domain.store.entity.StoreEmployee;

import java.time.LocalDateTime;

/**
 * 시간 경매 입찰 (Auction_Bids) 테이블과 매핑되는 엔티티입니다.
 * 알바생이 어떤 경매 매물에, 얼마를 입찰했는지 기록합니다.
 */
@Entity
@Table(name = "auction_bids")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuctionBid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bid_id")
    private Long id;

    // 하나의 경매(ShiftAuction)에 알바생들의 수많은 입찰(AuctionBid)이 달리므로 역방향 다대일 매핑
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private ShiftAuction shiftAuction;

    // 이 입찰을 등록한 알바생 정보
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id", nullable = false)
    private StoreEmployee bidder;

    // 알바생이 입찰 시 부른 희망 시급
    @Column(name = "bid_wage", nullable = false)
    private Integer bidWage;

    // 동시성 입찰이 발생했을 때, 정확한 등록 시간으로 순위를 가르기 위해 밀리초 단위까지의 기록 유지
    @Column(name = "bid_time", nullable = false)
    private LocalDateTime bidTime;

    @Builder
    public AuctionBid(ShiftAuction shiftAuction, StoreEmployee bidder, Integer bidWage) {
        this.shiftAuction = shiftAuction;
        this.bidder = bidder;
        this.bidWage = bidWage;
        this.bidTime = LocalDateTime.now();
    }

    /**
     * 동일 알바생이 입찰을 다시 할 경우, 금액과 시간을 업데이트합니다.
     */
    public void updateBidWage(Integer newBidWage) {
        this.bidWage = newBidWage;
        this.bidTime = LocalDateTime.now();
    }
}
