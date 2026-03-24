package com.almaengi.be.domain.chat.ws.service;

import com.almaengi.be.domain.chat.dto.ChatMessageRequestDto;
import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.almaengi.be.domain.chat.service.ChatMessageService;
import com.almaengi.be.domain.chat.type.ChatMessageType;
import com.almaengi.be.domain.chat.ws.pubsub.ChatPubSubDto;
import com.almaengi.be.domain.chat.ws.pubsub.ChatRedisPublisher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatWsService 단위 테스트")
class ChatWsServiceTest {

    @InjectMocks
    private ChatWsService chatWsService;

    @Mock
    private ChatMessageService chatMessageService;

    @Mock
    private ChatRedisPublisher chatRedisPublisher;

    @Test
    @DisplayName("메시지 저장 후 afterCommit에서 Redis publish 수행")
    void handleIncomingMessage_publishAfterCommit() {
        Long userId = 10L;
        Long roomId = 100L;

        ChatMessageRequestDto.SendMessage request = new ChatMessageRequestDto.SendMessage();
        ReflectionTestUtils.setField(request, "messageType", ChatMessageType.TEXT);
        ReflectionTestUtils.setField(request, "content", "ws 테스트 메시지");

        ChatMessageResponseDto.MessageItem saved = ChatMessageResponseDto.MessageItem.builder()
                .messageId(1200L)
                .roomId(roomId)
                .content("ws 테스트 메시지")
                .messageType(ChatMessageType.TEXT)
                .build();

        given(chatMessageService.sendMessage(eq(userId), eq(roomId), any(ChatMessageRequestDto.SendMessage.class)))
                .willReturn(saved);

        TransactionSynchronizationManager.initSynchronization();
        try {
            ChatMessageResponseDto.MessageItem result = chatWsService.handleIncomingMessage(userId, roomId, request);

            assertThat(result.getMessageId()).isEqualTo(1200L);
            verify(chatRedisPublisher, never()).publishMessageCreated(any(), any());

            for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
                synchronization.afterCommit();
            }

            verify(chatRedisPublisher, times(1)).publishMessageCreated(roomId, saved);
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    @DisplayName("읽음 처리 후 afterCommit에서 Redis read 이벤트 발행")
    void handleReadUpdate_publishAfterCommit() {
        Long userId = 10L;
        Long roomId = 100L;

        ChatMessageRequestDto.MarkRead request = new ChatMessageRequestDto.MarkRead();
        ReflectionTestUtils.setField(request, "lastReadMessageId", 1200L);

        TransactionSynchronizationManager.initSynchronization();
        try {
            chatWsService.handleReadUpdate(userId, roomId, request);

            verify(chatMessageService, times(1)).markAsRead(userId, roomId, request);
            verify(chatRedisPublisher, never()).publishReadUpdated(any(), any());

            for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
                synchronization.afterCommit();
            }

            verify(chatRedisPublisher, times(1))
                    .publishReadUpdated(eq(roomId), any(ChatPubSubDto.ReadUpdatedPayload.class));
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }
}
