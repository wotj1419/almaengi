package com.almaengi.be.domain.chat.ws.pubsub;

import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.almaengi.be.domain.chat.type.ChatMessageType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatRedisSubscriber 단위 테스트")
class ChatRedisSubscriberTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private SimpMessagingTemplate simpMessagingTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("MESSAGE_CREATED 이벤트를 room 구독 경로로 fan-out")
    void onMessage_messageCreated_success() {
        ChatRedisSubscriber subscriber = new ChatRedisSubscriber(redisTemplate, simpMessagingTemplate, objectMapper);

        ChatMessageResponseDto.MessageItem messageItem = ChatMessageResponseDto.MessageItem.builder()
                .messageId(1200L)
                .roomId(100L)
                .messageType(ChatMessageType.TEXT)
                .content("hello")
                .build();

        ChatPubSubDto.MessageCreatedPayload payload = ChatPubSubDto.MessageCreatedPayload.of(100L, messageItem);

        ChatPubSubDto.EventEnvelope event = ChatPubSubDto.EventEnvelope.builder()
                .eventType(ChatPubSubDto.EventType.MESSAGE_CREATED)
                .roomId(100L)
                .payload(toJson(payload))
                .build();

        RedisSerializer<Object> serializer = new RedisSerializer<>() {
            @Override
            public byte[] serialize(Object value) {
                return new byte[]{1};
            }

            @Override
            public Object deserialize(byte[] bytes) {
                return event;
            }
        };
        doReturn(serializer).when(redisTemplate).getValueSerializer();

        Message redisMessage = org.mockito.Mockito.mock(Message.class);
        when(redisMessage.getBody()).thenReturn(new byte[]{1});

        subscriber.onMessage(redisMessage, null);

        ArgumentCaptor<Object> payloadCaptor = ArgumentCaptor.forClass(Object.class);
        verify(simpMessagingTemplate, times(1))
                .convertAndSend(org.mockito.ArgumentMatchers.eq("/sub/chat/rooms/100"), payloadCaptor.capture());

        assertThat(payloadCaptor.getValue()).isNotNull();
        assertThat(payloadCaptor.getValue()).isInstanceOf(JsonNode.class);
    }

    @Test
    @DisplayName("READ_UPDATED 이벤트를 read 구독 경로로 fan-out")
    void onMessage_readUpdated_success() {
        ChatRedisSubscriber subscriber = new ChatRedisSubscriber(redisTemplate, simpMessagingTemplate, objectMapper);

        ChatPubSubDto.ReadUpdatedPayload payload = ChatPubSubDto.ReadUpdatedPayload.of(100L, 10L, 1200L);

        ChatPubSubDto.EventEnvelope event = ChatPubSubDto.EventEnvelope.builder()
                .eventType(ChatPubSubDto.EventType.READ_UPDATED)
                .roomId(100L)
                .payload(toJson(payload))
                .build();

        RedisSerializer<Object> serializer = new RedisSerializer<>() {
            @Override
            public byte[] serialize(Object value) {
                return new byte[]{1};
            }

            @Override
            public Object deserialize(byte[] bytes) {
                return event;
            }
        };
        doReturn(serializer).when(redisTemplate).getValueSerializer();

        Message redisMessage = org.mockito.Mockito.mock(Message.class);
        when(redisMessage.getBody()).thenReturn(new byte[]{1});

        subscriber.onMessage(redisMessage, null);

        ArgumentCaptor<Object> payloadCaptor = ArgumentCaptor.forClass(Object.class);
        verify(simpMessagingTemplate, times(1))
                .convertAndSend(org.mockito.ArgumentMatchers.eq("/sub/chat/rooms/100/read"), payloadCaptor.capture());

        assertThat(payloadCaptor.getValue()).isNotNull();
        assertThat(payloadCaptor.getValue()).isInstanceOf(ChatPubSubDto.ReadUpdatedPayload.class);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
