package com.almaengi.be.domain.chat.ws.pubsub;

import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;


// 메세지 저장 성공 후 Redis 채널로 이벤트 발행
//      메시지 채널: chat:room:{roomId}:message
//      읽음 채널:   chat:room:{roomId}:read
@Component
@RequiredArgsConstructor
public class ChatRedisPublisher {
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public void publishMessageCreated(Long roomId, ChatMessageResponseDto.MessageItem messageItem) {
        ChatPubSubDto.MessageCreatedPayload payload = ChatPubSubDto.MessageCreatedPayload.of(roomId, messageItem);

        ChatPubSubDto.EventEnvelope event = ChatPubSubDto.EventEnvelope.builder()
                .eventType(ChatPubSubDto.EventType.MESSAGE_CREATED)
                .roomId(roomId)
                .payload(toJson(payload))
                .build();

        publish(buildMessageChannel(roomId), event);
    }
    public void publishReadUpdated(Long roomId, ChatPubSubDto.ReadUpdatedPayload payload) {
        ChatPubSubDto.EventEnvelope event = ChatPubSubDto.EventEnvelope.builder()
                .eventType(ChatPubSubDto.EventType.READ_UPDATED)
                .roomId(roomId)
                .payload(toJson(payload))
                .build();

        publish(buildReadChannel(roomId), event);
    }

    private void publish(String channel, ChatPubSubDto.EventEnvelope event) {
        redisTemplate.convertAndSend(channel, event);
    }
    private String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch(JsonProcessingException e) {
            throw new IllegalStateException("Pub/Sub payload 직렬화 실패", e);
        }
    }

    public static String buildMessageChannel(Long roomId) {
        return "chat:room:" + roomId + ":message";
    }
    public static String buildReadChannel(Long roomId) {
        return "chat:room:" + roomId + ":read";
    }
}
