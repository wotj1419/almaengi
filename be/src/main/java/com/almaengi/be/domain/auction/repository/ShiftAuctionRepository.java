package com.almaengi.be.domain.auction.repository;

import com.almaengi.be.domain.auction.entity.ShiftAuction;
import com.almaengi.be.domain.auction.type.AuctionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * 대타 스케줄 경매(Shift_Auctions) 데이터를 관리하는 저장소입니다.
 */
public interface ShiftAuctionRepository extends JpaRepository<ShiftAuction, Long> {

    // 특정 매장의 현재 "진행 중"인 경매 목록만 화면에 뿌려주기 위한 기본 검색 쿼리
    List<ShiftAuction> findByStoreIdAndStatus(Long storeId, AuctionStatus status);

    // 매장에 등록된 모든 경매 내역 조회
    List<ShiftAuction> findAllByStoreId(Long storeId);

    long countByStoreIdAndCreatedAtBetween(Long storeId, LocalDateTime start, LocalDateTime end);
    long countByStoreIdAndStatusAndCreatedAtBetween(Long storeId, AuctionStatus status,  LocalDateTime start, LocalDateTime end);

    @Query(value = """
        SELECT
            EXTRACT(DOW FROM sa.target_date)::int AS dayOfWeekValue,
            sa.start_time AS startTime,
            sa.end_time AS endTime,
            COUNT(*) AS auctionCount
        FROM shift_auctions sa
        WHERE sa.store_id = :storeId
          AND sa.created_at BETWEEN :start AND :end
        GROUP BY EXTRACT(DOW FROM sa.target_date), sa.start_time, sa.end_time
        ORDER BY auctionCount DESC, dayOfWeekValue ASC, startTime ASC
    """, countQuery = """
        SELECT COUNT(*) FROM (
            SELECT 1
            FROM shift_auctions sa
            WHERE sa.store_id = :storeId
              AND sa.created_at BETWEEN :start AND :end
            GROUP BY EXTRACT(DOW FROM sa.target_date), sa.start_time, sa.end_time
        ) t
    """, nativeQuery = true)
    Page<TimelineProjection> findTimelineReport(@Param("storeId") Long storeId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);

    interface TimelineProjection {
        Integer getDayOfWeekValue();
        LocalTime getStartTime();
        LocalTime getEndTime();
        Long getAuctionCount();
    }
}
