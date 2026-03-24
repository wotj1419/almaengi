package com.almaengi.be.domain.chat.ws.pubsub;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

// Redis 이벤트 수신 후 STOMP 구독 경로로 fan-out
// 모든 인스턴스가 같은 Redis 채널을 구독하므로 멀티 인스턴스 전달이 가능해짐.
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatRedisSubscriber implements MessageListener {
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        ChatPubSubDto.EventEnvelope event = deserialize(message);
        if(event == null || event.getRoomId() == null || event.getEventType() == null) return;

        try {
            if(event.getEventType() == ChatPubSubDto.EventType.MESSAGE_CREATED) {
                JsonNode payloadNode = objectMapper.readTree(event.getPayload());
                JsonNode messageNode = payloadNode.get("message");

                // 클라이언트 호환을 위해 message 본문만 브로드캐스트
                simpMessagingTemplate.convertAndSend("/sub/chat/rooms/" + event.getRoomId(), messageNode);
                return;
            }

            if(event.getEventType() == ChatPubSubDto.EventType.READ_UPDATED) {
                ChatPubSubDto.ReadUpdatedPayload payload = objectMapper.readValue(event.getPayload(), ChatPubSubDto.ReadUpdatedPayload.class);

                simpMessagingTemplate.convertAndSend("/sub/chat/rooms/" + event.getRoomId() + "/read", payload);
            }
        } catch(Exception e) {
            log.warn("[CHAT-REDIS] subscribe event handling failed. roomId={}, reason={}",
                    event.getRoomId(), e.getMessage());
        }
    }

    private ChatPubSubDto.EventEnvelope deserialize(Message message) {
        RedisSerializer<Object> serializer = (RedisSerializer<Object>) redisTemplate.getValueSerializer();
        Object obj = serializer.deserialize(message.getBody());
        if (obj instanceof ChatPubSubDto.EventEnvelope envelope) {
            return envelope;
        }
        return null;
    }
}
