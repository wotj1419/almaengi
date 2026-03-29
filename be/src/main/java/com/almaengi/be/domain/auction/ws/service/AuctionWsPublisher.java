package com.almaengi.be.domain.auction.ws.service;

import com.almaengi.be.domain.auction.ws.dto.AuctionWsEventDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

// 경매 변경 이벤트를 STOMP 구독 채널로 발행
@Component
@RequiredArgsConstructor
public class AuctionWsPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public void publishStoreEvent(AuctionWsEventDto event) {
        messagingTemplate.convertAndSend("/sub/auctions/stores/" + event.getStoreId(), event);
    }
}
