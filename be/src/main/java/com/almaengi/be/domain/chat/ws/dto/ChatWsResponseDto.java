package com.almaengi.be.domain.chat.ws.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class ChatWsResponseDto {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(name = "ChatWsErrorResponse", description = "WebSocket 에러 응답")
    public static class Error {
        @Schema(description = "에러 코드", example = "C003")
        private String code;
        @Schema(description = "에러 메시지", example = "채팅방의 활성 멤버가 아닙니다.")
        private String message;
        @Schema(description = "요청 destination", example = "/pub/chat/rooms/100/messages")
        private String destination;
        @Schema(description = "세션 ID", example = "7f0c...")
        private String sessionId;

        public static Error of(String code, String message, String destination, String sessionId) {
            return Error.builder()
                    .code(code)
                    .message(message)
                    .destination(destination)
                    .sessionId(sessionId)
                    .build();
        }
    }
}
