package com.almaengi.be.domain.auction.entity;

import com.almaengi.be.domain.store.entity.StoreEmployee;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 시간 경매 (대타 구인) 낙찰자 테이블과 매핑되는 엔티티입니다.
 * 사장님이 다수의 알바생을 선택할 수 있으므로, ShiftAuction과 StoreEmployee 사이의 다대다(N:M) 관계를 풀어주는
 * 연결 테이블 역할을 합니다.
 */
@Entity
@Table(name = "auction_winners")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuctionWinner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "winner_record_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private ShiftAuction shiftAuction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private StoreEmployee storeEmployee;

    @Column(name = "selected_at", nullable = false)
    private LocalDateTime selectedAt;

    @Builder
    public AuctionWinner(ShiftAuction shiftAuction, StoreEmployee storeEmployee) {
        this.shiftAuction = shiftAuction;
        this.storeEmployee = storeEmployee;
        this.selectedAt = LocalDateTime.now();
    }
}
