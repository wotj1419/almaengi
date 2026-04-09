package com.almaengi.be.domain.auction.repository;

import com.almaengi.be.domain.auction.entity.AuctionBid;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 시간 경매 입찰(Auction_Bids) 데이터를 관리하는 저장소입니다.
 */
public interface AuctionBidRepository extends JpaRepository<AuctionBid, Long> {

    /**
     * [핵심 로직]
     * 역경매 특성상 누군가 새로운 금액을 입찰하려면 현재 시스템 상의 1위 입찰가보다 훨씬 낮게 불러야 합니다.
     * 따라서 특정 경매(auctionId)에 걸린 입찰들을 '시급 오름차순(ASC)'으로 정렬하고,
     * 만일 시급이 같다면 '먼저 낸 사람(ASC)'이 우선권을 가지도록 정렬한 후 제일 첫 번째(LIMIT 1)를 가져옵니다.
     */
    Optional<AuctionBid> findTopByShiftAuctionIdOrderByBidWageAscBidTimeAsc(Long shiftAuctionId);

    /**
     * 특정 알바생(bidderId)이 이 경매(shiftAuctionId)에 이미 지원했는지 확인하는 메서드입니다.
     */
    Optional<AuctionBid> findByShiftAuctionIdAndBidderId(Long shiftAuctionId, Long bidderId);

    /**
     * 특정 경매(shiftAuctionId)에 입찰한 모든 지원 내역을 가져옵니다.
     */
    List<AuctionBid> findAllByShiftAuctionId(Long shiftAuctionId);
}
