package com.almaengi.be.domain.auction.repository;

import com.almaengi.be.domain.auction.entity.AuctionWinner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 시간 경매 다중 낙찰자(Auction_Winners) 데이터를 관리하는 저장소입니다.
 */
@Repository
public interface AuctionWinnerRepository extends JpaRepository<AuctionWinner, Long> {
    List<AuctionWinner> findAllByShiftAuctionId(Long shiftAuctionId);

    @Query(value = """
        SELECT AVG(ab.bid_wage)
        FROM auction_winners aw
            JOIN shift_auctions sa ON sa.auction_id = aw.auction_id
            JOIN auction_bids ab ON ab.auction_id = aw.auction_id
                                            AND ab.bidder_id = aw.employee_id
            WHERE sa.store_id = :storeId
                AND sa.status = 'CLOSED'
                AND sa.created_at BETWEEN :start AND :end
    """, nativeQuery = true)
    Double findAverageWinningWage(@Param("storeId") Long storeId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
