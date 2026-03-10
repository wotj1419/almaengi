package com.almaengi.be.domain.auction.repository;

import com.almaengi.be.domain.auction.entity.AuctionWinner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 시간 경매 다중 낙찰자(Auction_Winners) 데이터를 관리하는 저장소입니다.
 */
@Repository
public interface AuctionWinnerRepository extends JpaRepository<AuctionWinner, Long> {
    List<AuctionWinner> findAllByShiftAuctionId(Long shiftAuctionId);
}
