package com.almaengi.be.domain.chat.controller;

import com.almaengi.be.domain.chat.controller.docs.ChatRoomControllerDocs;
import com.almaengi.be.domain.chat.dto.ChatRoomRequestDto;
import com.almaengi.be.domain.chat.dto.ChatRoomResponseDto;
import com.almaengi.be.domain.chat.service.ChatRoomService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatRoomController implements ChatRoomControllerDocs {
    private final ChatRoomService chatRoomService;

    // DM 방 생성 / 사용
    @Override
    @PostMapping("/stores/{storeId}/rooms/dm")
    public ApiResponse<ChatRoomResponseDto.RoomDetail> createOrGetDirectRoom(@AuthUser Long userId, @PathVariable Long storeId,
                                                                              @Valid @RequestBody ChatRoomRequestDto.CreateDirect request) {
        ChatRoomResponseDto.RoomDetail response = chatRoomService.createOrGetDirectRoom(userId, storeId, request);
        return ApiResponse.success(response);
    }

    // 그룹방 생성
    @Override
    @PostMapping("/stores/{storeId}/rooms/group")
    public ApiResponse<ChatRoomResponseDto.RoomDetail> createGroupRoom(@AuthUser Long userId, @PathVariable Long storeId,
                                                                        @Valid @RequestBody ChatRoomRequestDto.CreateGroup request) {
        ChatRoomResponseDto.RoomDetail response = chatRoomService.createGroupRoom(userId, storeId, request);
        return ApiResponse.success(response);
    }

    // 봇방 생성 / 사용
    @Override
    @PostMapping("/stores/{storeId}/rooms/bot")
    public ApiResponse<ChatRoomResponseDto.RoomDetail> createOrGetBotRoom(@AuthUser Long userId, @PathVariable Long storeId,
                                                                           @Valid @RequestBody ChatRoomRequestDto.CreateBot request) {
        ChatRoomResponseDto.RoomDetail response = chatRoomService.createOrGetBotRoom(userId, storeId, request);
        return ApiResponse.success(response);
    }

    // 방 이름 수정
    @Override
    @PatchMapping("/rooms/{roomId}")
    public ApiResponse<ChatRoomResponseDto.RoomDetail> updateRoomName(@AuthUser Long userId, @PathVariable Long roomId,
                                                                       @Valid @RequestBody ChatRoomRequestDto.UpdateName request) {
        ChatRoomResponseDto.RoomDetail response = chatRoomService.updateRoomName(userId, roomId, request);
        return ApiResponse.success(response);
    }

    // 매장 내 내가 참여한 방 목록 조회
    @Override
    @GetMapping("/stores/{storeId}/rooms")
    public ApiResponse<List<ChatRoomResponseDto.RoomSummary>> getRooms(@AuthUser Long userId, @PathVariable Long storeId) {
        List<ChatRoomResponseDto.RoomSummary> response = chatRoomService.getRooms(userId, storeId);
        return ApiResponse.success(response);
    }

    // 방 상세 조회
    @Override
    @GetMapping("/rooms/{roomId}")
    public ApiResponse<ChatRoomResponseDto.RoomDetail> getRoom(@AuthUser Long userId, @PathVariable Long roomId) {
        ChatRoomResponseDto.RoomDetail response = chatRoomService.getRoom(userId, roomId);
        return ApiResponse.success(response);
    }
}
