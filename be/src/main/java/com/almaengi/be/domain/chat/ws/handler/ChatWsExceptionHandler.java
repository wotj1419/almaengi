package com.almaengi.be.domain.chat.ws.handler;

import com.almaengi.be.domain.chat.ws.dto.ChatWsResponseDto;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

// @MessageMapping 내부에서 발생한 예외를 /user/queue/errors 로 전달합니다.
@Slf4j
@Component
public class ChatWsExceptionHandler {

    @MessageExceptionHandler(BusinessException.class)
    @SendToUser("/queue/errors")
    public ChatWsResponseDto.Error handleBusinessException(BusinessException e,
                                                           @Header(name = "simpDestination", required = false) String destination,
                                                           @Header(name = "simpSessionId", required = false) String sessionId) {
        ErrorCode code = e.getErrorCode();
        log.warn("[WS] BusinessException code={}, message={}", code.getCode(), code.getMessage());
        return ChatWsResponseDto.Error.of(code.getCode(), code.getMessage(), destination, sessionId);
    }

    @MessageExceptionHandler(AccessDeniedException.class)
    @SendToUser("/queue/errors")
    public ChatWsResponseDto.Error handleAccessDenied(AccessDeniedException e,
                                                      @Header(name = "simpDestination", required = false) String destination,
                                                      @Header(name = "simpSessionId", required = false) String sessionId) {

        ErrorCode code = resolveAccessDeniedCode(e.getMessage());
        return ChatWsResponseDto.Error.of(
                code.getCode(),
                e.getMessage() != null ? e.getMessage() : code.getMessage(),
                destination, sessionId
        );
    }

    @MessageExceptionHandler(IllegalArgumentException.class)
    @SendToUser("/queue/errors")
    public ChatWsResponseDto.Error handleIllegalArgument(IllegalArgumentException e,
                                                         @Header(name = "simpDestination", required = false) String destination,
                                                         @Header(name = "simpSessionId", required = false) String sessionId) {
        return ChatWsResponseDto.Error.of(
                ErrorCode.INVALID_INPUT_VALUE.getCode(),
                ErrorCode.INVALID_INPUT_VALUE.getMessage(),
                destination, sessionId
        );
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser("/queue/errors")
    public ChatWsResponseDto.Error handleException(Exception e,
                                                   @Header(name = "simpDestination", required = false) String destination,
                                                   @Header(name = "simpSessionId", required = false) String sessionId) {
        log.error("[WS] Unexpected error", e);
        return ChatWsResponseDto.Error.of(
                ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                ErrorCode.INTERNAL_SERVER_ERROR.getMessage(),
                destination, sessionId);
    }


    private ErrorCode resolveAccessDeniedCode(String message) {
        if (message == null) {
            return ErrorCode.CHAT_ROOM_ACCESS_DENIED;
        }
        // 표 기준: room 멤버십 실패는 C003으로 매핑
        if (message.contains("구독 권한") || message.contains("전송 권한") || message.contains("활성 멤버")) {
            return ErrorCode.CHAT_MEMBER_NOT_ACTIVE;
        }
        // CONNECT 인증 실패 등은 C002로 매핑
        return ErrorCode.CHAT_ROOM_ACCESS_DENIED;
    }
}
