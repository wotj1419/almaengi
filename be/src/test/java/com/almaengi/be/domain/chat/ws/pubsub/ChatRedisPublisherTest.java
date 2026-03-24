package com.almaengi.be.domain.chat.ws.pubsub;

import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.almaengi.be.domain.chat.type.ChatMessageType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatRedisPublisher 단위 테스트")
class ChatRedisPublisherTest {

    @InjectMocks
    private ChatRedisPublisher chatRedisPublisher;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("메시지 생성 이벤트를 room 메시지 채널로 발행")
    void publishMessageCreated_success() {
        chatRedisPublisher = new ChatRedisPublisher(redisTemplate, objectMapper);

        Long roomId = 100L;
        ChatMessageResponseDto.MessageItem item = ChatMessageResponseDto.MessageItem.builder()
                .messageId(3000L)
                .roomId(roomId)
                .messageType(ChatMessageType.TEXT)
                .content("redis publish 테스트")
                .build();

        chatRedisPublisher.publishMessageCreated(roomId, item);

        ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
        verify(redisTemplate, times(1)).convertAndSend(
                org.mockito.ArgumentMatchers.eq("chat:room:100:message"),
                eventCaptor.capture()
        );

        assertThat(eventCaptor.getValue()).isInstanceOf(ChatPubSubDto.EventEnvelope.class);
        ChatPubSubDto.EventEnvelope event = (ChatPubSubDto.EventEnvelope) eventCaptor.getValue();
        assertThat(event.getEventType()).isEqualTo(ChatPubSubDto.EventType.MESSAGE_CREATED);
        assertThat(event.getRoomId()).isEqualTo(100L);
        assertThat(event.getPayload()).contains("redis publish 테스트");
    }

    @Test
    @DisplayName("읽음 갱신 이벤트를 room read 채널로 발행")
    void publishReadUpdated_success() {
        chatRedisPublisher = new ChatRedisPublisher(redisTemplate, objectMapper);

        Long roomId = 100L;
        ChatPubSubDto.ReadUpdatedPayload payload = ChatPubSubDto.ReadUpdatedPayload.of(roomId, 10L, 1200L);

        chatRedisPublisher.publishReadUpdated(roomId, payload);

        ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
        verify(redisTemplate, times(1)).convertAndSend(
                org.mockito.ArgumentMatchers.eq("chat:room:100:read"),
                eventCaptor.capture()
        );

        assertThat(eventCaptor.getValue()).isInstanceOf(ChatPubSubDto.EventEnvelope.class);
        ChatPubSubDto.EventEnvelope event = (ChatPubSubDto.EventEnvelope) eventCaptor.getValue();
        assertThat(event.getEventType()).isEqualTo(ChatPubSubDto.EventType.READ_UPDATED);
        assertThat(event.getRoomId()).isEqualTo(100L);
        assertThat(event.getPayload()).contains("lastReadMessageId");
    }
}
