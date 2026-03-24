package com.almaengi.be.domain.chat.ws.pubsub;

import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// Redis Pub/Sub 전용 DTO 묶음
// - EventEnvelope: 채널 공통 envelope
// - MessageCreatedPayload: 메시지 생성 이벤트 payload
// - ReadUpdatePayload: 읽음 갱신 이벤트 payload
public class ChatPubSubDto {
    public enum EventType {
        MESSAGE_CREATED,
        READ_UPDATED
    }


    // Redis Pub/Sub에 실어 보낼 이벤트 표준 DTO
    // payload는 JSON 문자열로 저장하여 직렬화/역직렬화 실패 가능성을 줄임
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventEnvelope {
        private EventType eventType;
        private Long roomId;
        private String payload; // payload JSON 문자열
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageCreatedPayload {
        private Long roomId;
        private ChatMessageResponseDto.MessageItem message;

        public static MessageCreatedPayload of(Long roomId, ChatMessageResponseDto.MessageItem message) {
            return MessageCreatedPayload.builder()
                    .roomId(roomId)
                    .message(message)
                    .build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadUpdatedPayload {
        private Long roomId;
        private Long readerId;
        private Long lastReadMessageId;

        public static ReadUpdatedPayload of(Long roomId, Long readerId, Long lastReadMessageId) {
            return ReadUpdatedPayload.builder()
                    .roomId(roomId)
                    .readerId(readerId)
                    .lastReadMessageId(lastReadMessageId)
                    .build();
        }
    }
}
