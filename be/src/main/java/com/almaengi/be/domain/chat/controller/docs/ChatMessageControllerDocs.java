package com.almaengi.be.domain.chat.controller.docs;

import com.almaengi.be.domain.chat.dto.ChatMessageRequestDto;
import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
@Tag(name = "채팅 메시지 API", description = "채팅 메시지 전송/조회 API")
public interface ChatMessageControllerDocs {
    @Operation(
            summary = "메시지 전송",
            description = "채팅방에 TEXT 메시지를 저장하고, 같은 트랜잭션에서 room의 last_message 포인터를 갱신합니다. " +
                    "BOT 방이면 사용자 메시지 저장 후 비동기 RAG 요청을 트리거합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "메시지 저장 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "G002: 요청 DTO 유효성 실패.<br>C008: Step4에서 지원하지 않는 메시지 타입."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "C003: 채팅방의 활성 멤버가 아님."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "C001: 채팅방 없음.<br>U001: 사용자 없음."
            )
    })
    ApiResponse<ChatMessageResponseDto.MessageItem> sendMessage(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "채팅방 ID", example = "100") @PathVariable Long roomId,
            @Valid @RequestBody ChatMessageRequestDto.SendMessage request
    );
    @Operation(
            summary = "메시지 이력 조회 (커서 기반)",
            description = "roomId 기준으로 메시지를 id DESC 정렬로 조회합니다. cursor가 있으면 cursor 미만(id < cursor)만 반환합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "메시지 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "C007: 잘못된 커서 값(0 이하)."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "C003: 채팅방의 활성 멤버가 아님."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "C001: 채팅방 없음."
            )
    })
    ApiResponse<ChatMessageResponseDto.MessagePage> getMessages(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "채팅방 ID", example = "100") @PathVariable Long roomId,
            @Parameter(description = "다음 페이지 기준 커서(messageId)", example = "1200")
            @RequestParam(required = false) Long cursor,
            @Parameter(description = "페이지 크기(1~100)", example = "30")
            @RequestParam(defaultValue = "30") Integer size
    );

    @Operation(
            summary = "읽음 처리",
            description = "현재 사용자의 chat_room_members.last_read_message_id/last_read_at를 갱신합니다. " +
                    "lastReadMessageId는 반드시 해당 room의 메시지여야 합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "읽음 처리 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "G002: 요청 DTO 유효성 실패.<br>" +
                            "C004: 메시지를 찾을 수 없음.<br>" +
                            "C005: 메시지와 채팅방 참조 불일치.<br>" +
                            "C008: 읽음 포인터 역행(기존보다 작은 ID)."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "C003: 채팅방의 활성 멤버가 아님."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "C001: 채팅방 없음."
            )
    })
    ApiResponse<Void> markAsRead(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "채팅방 ID", example = "100") @PathVariable Long roomId,
            @Valid @RequestBody ChatMessageRequestDto.MarkRead request
    );
}