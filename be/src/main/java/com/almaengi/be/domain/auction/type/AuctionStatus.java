package com.almaengi.be.domain.auction.type;

/**
 * 대타 스케줄 경매의 진행 상태를 나타내는 열거형 클래스입니다.
 */
public enum AuctionStatus {
    IN_PROGRESS, // 경매 진행 중 (입찰 가능)
    CLOSED, // 경매 마감 (최종 낙찰자 확정)
    CANCELLED // 경매 취소
}
