package com.almaengi.be.domain.chat.ws.handler;

import com.almaengi.be.domain.chat.ws.dto.ChatWsResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ChatStompErrorHandler 단위 테스트")
class ChatStompErrorHandlerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ChatStompErrorHandler handler = new ChatStompErrorHandler(objectMapper);

    @Test
    @DisplayName("인터셉터 권한 실패는 STOMP ERROR body C003으로 응답")
    void handleClientMessageProcessingError_accessDeniedMember_mapsC003() throws Exception {
        Message<byte[]> clientMessage = buildClientMessage("/sub/chat/rooms/100", "s-1");

        Message<byte[]> errorMessage = handler.handleClientMessageProcessingError(
                clientMessage,
                new AccessDeniedException("채팅방 구독 권한이 없습니다.")
        );

        ChatWsResponseDto.Error body = objectMapper.readValue(errorMessage.getPayload(), ChatWsResponseDto.Error.class);

        assertThat(body.getCode()).isEqualTo("C003");
        assertThat(body.getDestination()).isEqualTo("/sub/chat/rooms/100");
        assertThat(body.getSessionId()).isEqualTo("s-1");
    }

    @Test
    @DisplayName("예상치 못한 예외는 STOMP ERROR body G001으로 응답")
    void handleClientMessageProcessingError_unexpected_mapsG001() throws Exception {
        Message<byte[]> clientMessage = buildClientMessage("/pub/chat/rooms/100/messages", "s-2");

        Message<byte[]> errorMessage = handler.handleClientMessageProcessingError(
                clientMessage,
                new IllegalStateException("unexpected")
        );

        ChatWsResponseDto.Error body = objectMapper.readValue(errorMessage.getPayload(), ChatWsResponseDto.Error.class);

        assertThat(body.getCode()).isEqualTo("G001");
        assertThat(body.getDestination()).isEqualTo("/pub/chat/rooms/100/messages");
        assertThat(body.getSessionId()).isEqualTo("s-2");
    }

    private Message<byte[]> buildClientMessage(String destination, String sessionId) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setDestination(destination);
        accessor.setSessionId(sessionId);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
