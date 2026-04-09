package com.almaengi.be.domain.chat.dto;
import com.almaengi.be.domain.chat.entity.ChatMessage;
import com.almaengi.be.domain.chat.type.ChatMessageType;
import com.almaengi.be.domain.chat.type.ChatRoomType;
import com.fasterxml.jackson.databind.ObjectMapper;
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
        // ===== AI 응답 확장 필드 =====
        @Schema(description = "AI 답변 본문(BOT 메시지에서만 값 존재)", example = "주휴수당은 1주 소정근로시간이 15시간 이상이고...")
        private String answer;
        @Schema(description = "AI 근거 목록(BOT 메시지에서만 값 존재)")
        private List<String> sources;
        @Schema(description = "AI 의도 분류(BOT 메시지에서만 값 존재)", example = "LEGAL_QUERY")
        private String intent;
        private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
        public static MessageItem from(ChatMessage message) {
            BotAiMeta meta = extractBotMeta(message);
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
                    // 일반 메시지에는 null/빈배열, BOT 메시지에는 실제 값
                    .answer(meta.answer())
                    .sources(meta.sources())
                    .intent(meta.intent())
                    .build();
        }
        /**
         * BOT 메시지에서만 meta_json 파싱.
         * - DM/GROUP은 항상 answer/sources/intent를 비웁니다.
         * - 파싱 실패 시에도 안전하게 빈값 처리합니다.
         */
        private static BotAiMeta extractBotMeta(ChatMessage message) {
            if (message.getRoom().getRoomType() != ChatRoomType.BOT) {
                return BotAiMeta.empty();
            }
            String metaJson = message.getMetaJson();
            if (metaJson == null || metaJson.isBlank()) {
                return BotAiMeta.empty();
            }
            try {
                BotAiMeta parsed = OBJECT_MAPPER.readValue(metaJson, BotAiMeta.class);
                if (parsed == null) return BotAiMeta.empty();
                List<String> normalizedSources = parsed.sources() == null
                        ? List.of()
                        : parsed.sources().stream()
                        .filter(v -> v != null && !v.isBlank())
                        .map(String::trim)
                        .distinct()
                        .toList();
                return new BotAiMeta(parsed.answer(), normalizedSources, parsed.intent());
            } catch (Exception e) {
                return BotAiMeta.empty();
            }
        }
        // meta_json 구조와 동일한 DTO
        private record BotAiMeta(String answer, List<String> sources, String intent) {
            static BotAiMeta empty() {
                return new BotAiMeta(null, List.of(), null);
            }
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