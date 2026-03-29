package com.almaengi.be.domain.auction.ws.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 경매 목록 실시간 동기화를 위한 WS 이벤트 DTO
 * - 클라이언트는 storeId 기준으로 구독하고,
 *   eventType/auctionId를 보고 필요한 query invalidate를 수행합니다.
 */
@Getter
@Builder
public class AuctionWsEventDto {
    private EventType eventType;
    private Long storeId;
    private Long auctionId;
    private LocalDateTime occurredAt;
    public enum EventType {
        AUCTION_CREATED,
        AUCTION_UPDATED,
        AUCTION_DELETED,
        AUCTION_CLOSED
    }
    public static AuctionWsEventDto of(EventType eventType, Long storeId, Long auctionId) {
        return AuctionWsEventDto.builder()
                .eventType(eventType)
                .storeId(storeId)
                .auctionId(auctionId)
                .occurredAt(LocalDateTime.now())
                .build();
    }
}