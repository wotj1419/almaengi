package com.almaengi.be.domain.chat.controller;

import com.almaengi.be.domain.chat.controller.docs.ChatMessageControllerDocs;
import com.almaengi.be.domain.chat.dto.ChatMessageRequestDto;
import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.almaengi.be.domain.chat.service.ChatMessageService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatMessageController implements ChatMessageControllerDocs {
    private final ChatMessageService chatMessageService;

    @Override
    @PostMapping("/rooms/{roomId}/messages")
    public ApiResponse<ChatMessageResponseDto.MessageItem> sendMessage(@AuthUser Long userId, @PathVariable Long roomId,
                                                                       @Valid @RequestBody ChatMessageRequestDto.SendMessage request) {
        ChatMessageResponseDto.MessageItem response = chatMessageService.sendMessage(userId, roomId, request);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/rooms/{roomId}/messages")
    public ApiResponse<ChatMessageResponseDto.MessagePage> getMessages(@AuthUser Long userId, @PathVariable Long roomId,
                                                                       @RequestParam(required = false) Long cursor,
                                                                       @RequestParam(defaultValue = "30") Integer size) {
        ChatMessageResponseDto.MessagePage response = chatMessageService.getMessages(userId, roomId, cursor, size);
        return ApiResponse.success(response);
    }

    @Override
    @PostMapping("/rooms/{roomId}/read")
    public ApiResponse<Void> markAsRead(@AuthUser Long userId, @PathVariable Long roomId,
                                        @Valid @RequestBody ChatMessageRequestDto.MarkRead request
    ) {
        chatMessageService.markAsRead(userId, roomId, request);
        return ApiResponse.success();
    }
}
