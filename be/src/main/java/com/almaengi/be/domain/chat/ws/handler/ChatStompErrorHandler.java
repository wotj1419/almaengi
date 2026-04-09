package com.almaengi.be.domain.chat.ws.handler;

import com.almaengi.be.domain.chat.ws.dto.ChatWsResponseDto;
import com.almaengi.be.global.error.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

// @MessageExceptionHandler는 컨트롤러 진입 후 예외를 다룸.
// CONNECT/SUBSCRIBE preSend에서 터지는 예외는 별도 핸들러로 다뤄야함.
// 인터셉터(preSend) 단계에서 발생한 예외를 STOMP ERROR frame으로 변환.
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatStompErrorHandler extends StompSubProtocolErrorHandler {
    private final ObjectMapper objectMapper;

    @Override
    public Message<byte[]> handleClientMessageProcessingError(Message<byte[]> clientMessage, Throwable ex) {
        Throwable root = unwrap(ex);

        String destination = null;
        String sessionId = null;
        if(clientMessage != null) {
            StompHeaderAccessor clientAccessor = StompHeaderAccessor.wrap(clientMessage);
            destination = clientAccessor.getDestination();
            sessionId = clientAccessor.getSessionId();
        }

        ErrorCode code = resolveErrorCode(root);
        String message = (root.getMessage() != null && !root.getMessage().isBlank())
                ? root.getMessage()
                : code.getMessage();

        ChatWsResponseDto.Error payload = ChatWsResponseDto.Error.of(code.getCode(), message, destination, sessionId);

        try {
            byte[] body = objectMapper.writeValueAsBytes(payload);

            StompHeaderAccessor errorAccessor = StompHeaderAccessor.create(StompCommand.ERROR);
            errorAccessor.setMessage(message);
            if(sessionId != null) errorAccessor.setSessionId(sessionId);

            return MessageBuilder.createMessage(body, errorAccessor.getMessageHeaders());
        } catch(Exception e) {
            log.error("[WS] stomp error payload serialization failed", e);
            return super.handleClientMessageProcessingError(clientMessage, ex);
        }
    }

    private Throwable unwrap(Throwable ex) {
        Throwable cur = ex;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        return cur;
    }

    private ErrorCode resolveErrorCode(Throwable t) {
        if (t instanceof AccessDeniedException ade) {
            String msg = ade.getMessage();
            if (msg != null && (msg.contains("구독 권한") || msg.contains("전송 권한") || msg.contains("활성 멤버"))) {
                return ErrorCode.CHAT_MEMBER_NOT_ACTIVE; // C003
            }
            return ErrorCode.CHAT_ROOM_ACCESS_DENIED; // C002 (CONNECT 인증 실패 포함)
        }
        return ErrorCode.INTERNAL_SERVER_ERROR; // G001
    }
}
