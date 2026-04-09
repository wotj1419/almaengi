package com.almaengi.be.domain.chat.dto;

import com.almaengi.be.domain.chat.type.ChatMessageType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

public class ChatMessageRequestDto {

    @Schema(name = "ChatMessageSendRequest", description = "채팅 메시지 전송 요청 DTO")
    @Getter
    public static class SendMessage {
        @Schema(description = "메시지 타입 MVP(TEXT만 허용)", example = "TEXT")
        @NotNull(message = "message-type은 필수입니다.")
        private ChatMessageType messageType;

        @Schema(description = "메시지 본문", example = "오늘 6시 출근 가능해요.")
        @NotBlank(message = "채팅 내용을 입력하세요.")
        private String content;
    }

    @Schema(name = "ChatMessageMarkReadRequest", description = "채팅 읽음 처리 요청 DTO")
    @Getter
    public static class MarkRead {
        @Schema(description = "마지막으로 읽은 메시지 ID", example = "1200")
        @NotNull(message = "lastReadMessageId는 필수입니다.")
        private Long lastReadMessageId;
    }
}
