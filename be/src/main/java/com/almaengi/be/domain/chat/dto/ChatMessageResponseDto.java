package com.almaengi.be.domain.chat.dto;

import com.almaengi.be.domain.chat.entity.ChatMessage;
import com.almaengi.be.domain.chat.type.ChatMessageType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

public class ChatMessageResponseDto {

    @Schema(name = "ChatMessageItem", description = "단일 채팅 메시지 응답")
    @Getter
    @Builder
    public static class MessageItem {
        @Schema(description = "메시지 ID", example = "1200")
        private Long messageId;
        @Schema(description = "채팅방 ID", example = "100")
        private Long roomId;
        @Schema(description = "발신자 사용자 ID (시스템 메시지는 null 가능)", example = "23")
        private Long senderId;
        @Schema(description = "발신자 이름 (시스템 메시지는 null 가능)", example = "김알바")
        private String senderName;
        @Schema(description = "메시지 타입", example = "TEXT")
        private ChatMessageType messageType;
        @Schema(description = "본문", example = "오늘 6시 출근 가능해요.")
        private String content;
        @Schema(description = "첨부 파일 URL", example = "https://cdn.example.com/file.png")
        private String fileUrl;
        @Schema(description = "발송 시각", type = "string", example = "2026-03-20T10:30:00")
        private LocalDateTime sentAt;
        @Schema(description = "삭제 여부", example = "false")
        private Boolean isDeleted;

        public static MessageItem from(ChatMessage message) {
            return MessageItem.builder()
                    .messageId(message.getId())
                    .roomId(message.getRoom().getId())
                    .senderId(message.getSender() != null ? message.getSender().getId() : null)
                    .senderName(message.getSender() != null ? message.getSender().getName() : null)
                    .messageType(message.getMessageType())
                    .content(message.getContent())
                    .fileUrl(message.getFileUrl())
                    .sentAt(message.getSentAt())
                    .isDeleted(message.getIsDeleted())
                    .build();
        }
    }

    @Getter
    @Builder
    @Schema(name = "ChatMessagePage", description = "커서 기반 메시지 페이지 응답")
    public static class MessagePage {
        @Schema(description = "메시지 목록 (최신순)")
        private List<MessageItem> messages;
        @Schema(description = "다음 페이지 조회용 커서 (null이면 더 없음)", example = "1170")
        private Long nextCursor;
        @Schema(description = "요청 페이지 크기", example = "30")
        private Integer size;
        public static MessagePage of(List<MessageItem> messages, Long nextCursor, Integer size) {
            return MessagePage.builder()
                    .messages(messages)
                    .nextCursor(nextCursor)
                    .size(size)
                    .build();
        }
    }
}
