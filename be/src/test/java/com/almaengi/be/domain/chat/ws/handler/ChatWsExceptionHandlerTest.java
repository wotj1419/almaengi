package com.almaengi.be.domain.chat.ws.handler;

import com.almaengi.be.domain.chat.ws.dto.ChatWsResponseDto;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ChatWsExceptionHandler 단위 테스트")
class ChatWsExceptionHandlerTest {

    private final ChatWsExceptionHandler handler = new ChatWsExceptionHandler();

    @Test
    @DisplayName("BusinessException은 ErrorCode 기준으로 매핑")
    void handleBusinessException_mapsErrorCode() {
        BusinessException ex = new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND);

        ChatWsResponseDto.Error result = handler.handleBusinessException(ex, "/pub/chat/rooms/100/messages", "s-1");

        assertThat(result.getCode()).isEqualTo("C001");
        assertThat(result.getMessage()).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND.getMessage());
        assertThat(result.getDestination()).isEqualTo("/pub/chat/rooms/100/messages");
        assertThat(result.getSessionId()).isEqualTo("s-1");
    }

    @Test
    @DisplayName("AccessDenied(멤버십 실패 메시지)는 C003으로 매핑")
    void handleAccessDenied_memberMessage_mapsC003() {
        AccessDeniedException ex = new AccessDeniedException("채팅방 구독 권한이 없습니다.");

        ChatWsResponseDto.Error result = handler.handleAccessDenied(ex, "/sub/chat/rooms/100", "s-2");

        assertThat(result.getCode()).isEqualTo("C003");
    }

    @Test
    @DisplayName("AccessDenied(인증 실패 메시지)는 C002로 매핑")
    void handleAccessDenied_authMessage_mapsC002() {
        AccessDeniedException ex = new AccessDeniedException("WS 인증 토큰이 없습니다.");

        ChatWsResponseDto.Error result = handler.handleAccessDenied(ex, null, "s-3");

        assertThat(result.getCode()).isEqualTo("C002");
    }
}
