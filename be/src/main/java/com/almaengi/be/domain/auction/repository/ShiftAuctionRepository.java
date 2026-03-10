package com.almaengi.be.domain.auction.repository;

import com.almaengi.be.domain.auction.entity.ShiftAuction;
import com.almaengi.be.domain.auction.type.AuctionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 대타 스케줄 경매(Shift_Auctions) 데이터를 관리하는 저장소입니다.
 */
public interface ShiftAuctionRepository extends JpaRepository<ShiftAuction, Long> {

    // 특정 매장의 현재 "진행 중"인 경매 목록만 화면에 뿌려주기 위한 기본 검색 쿼리
    List<ShiftAuction> findByStoreIdAndStatus(Long storeId, AuctionStatus status);

    // 매장에 등록된 모든 경매 내역 조회
    List<ShiftAuction> findAllByStoreId(Long storeId);
}
