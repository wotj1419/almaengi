package com.almaengi.be.domain.chat.ws.controller;

import com.almaengi.be.domain.chat.dto.ChatMessageRequestDto;
import com.almaengi.be.domain.chat.ws.service.ChatWsService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

// pub/chat/rooms/{roomId}/messages 수신
// 인증된 Principal 에서 userId 추출
// 저장 + 커밋 후 브로드캐스트는 ChatWsService 에서 처리
@Controller
@RequiredArgsConstructor
public class ChatWsController {
    private final ChatWsService chatWsService;

    @MessageMapping("/chat/rooms/{roomId}/messages")
    public void sendMessage(@DestinationVariable Long roomId, ChatMessageRequestDto.SendMessage request, Principal principal) {
        Long userId = extractUserId(principal);
        chatWsService.handleIncomingMessage(userId, roomId, request);
    }

    @MessageMapping("/chat/rooms/{roomId}/read")
    public void markAsRead(@DestinationVariable Long roomId, ChatMessageRequestDto.MarkRead request, Principal principal) {
        Long userId = extractUserId(principal);
        chatWsService.handleReadUpdate(userId, roomId, request);
    }

    private Long extractUserId(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new org.springframework.security.access.AccessDeniedException("인증된 사용자 정보가 없습니다.");
        }
        try {
            return Long.parseLong(principal.getName());
        } catch (NumberFormatException e) {
            throw new org.springframework.security.access.AccessDeniedException("유효하지 않은 사용자 식별자입니다.");
        }
    }
}
