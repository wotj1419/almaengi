package com.almaengi.be.domain.chat.ws.service;

import com.almaengi.be.domain.chat.dto.ChatMessageRequestDto;
import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.almaengi.be.domain.chat.service.ChatMessageService;
import com.almaengi.be.domain.chat.ws.pubsub.ChatPubSubDto;
import com.almaengi.be.domain.chat.ws.pubsub.ChatRedisPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

// WebSocket으로 수신한 메시지를 기존 HTTP 비지니스 로직(ChatMessageService)로 위임
// WS 수신 메시지를 DB 저장한 뒤 Redis로 발행
// 실제 WebSocket fan-out은 Redis Subscriber가 담당
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatWsService {
    private final ChatMessageService chatMessageService;
    private final ChatRedisPublisher chatRedisPublisher;

    @Transactional
    public ChatMessageResponseDto.MessageItem handleIncomingMessage(Long userId, Long roomId, ChatMessageRequestDto.SendMessage request) {
        ChatMessageResponseDto.MessageItem saved = chatMessageService.sendMessage(userId, roomId, request);

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    chatRedisPublisher.publishMessageCreated(roomId, saved);
                } catch(Exception e) {
                    // 실시간 전송 실패가 메시지 저장 성공을 깨지 않도록 로그만 남깁니다.
                    log.warn("[CHAT-WS] redis publish failed. roomId={}, messageId={}, reason={}", roomId, saved.getMessageId(), e.getMessage());
                }
            }
        });

        return saved;
    }

    // 읽음 처리 DB 반영 후 Redis READ_UPDATED 이벤트 발행
    @Transactional
    public void handleReadUpdate(Long userId, Long roomId, ChatMessageRequestDto.MarkRead request) {
        chatMessageService.markAsRead(userId, roomId, request);

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    ChatPubSubDto.ReadUpdatedPayload payload = ChatPubSubDto.ReadUpdatedPayload.of(roomId, userId, request.getLastReadMessageId());

                    chatRedisPublisher.publishReadUpdated(roomId, payload);
                } catch(Exception e) {
                    log.warn("[CHAT-WS] read publish failed. roomId={}, userId={}, reason={}", roomId, userId, e.getMessage());
                }
            }
        });
    }
}
