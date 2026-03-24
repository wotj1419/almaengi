package com.almaengi.be.domain.chat.controller.docs;

import com.almaengi.be.domain.chat.dto.ChatRoomRequestDto;
import com.almaengi.be.domain.chat.dto.ChatRoomResponseDto;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Tag(name = "Chat Room API", description = "채팅방 생성, 수정, 목록/상세 조회 API")
public interface ChatRoomControllerDocs {

    @Operation(
            summary = "DM 방 생성 또는 재사용",
            description = "같은 매장 내 두 사용자 간 DM 방이 이미 있으면 재사용하고, 없으면 생성합니다. " +
                    "요청자와 대상자는 모두 같은 매장 경계(사장/재직 직원) 검증을 통과해야 합니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "DM 방 생성/재사용 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "G002: 요청값 검증 실패(@Valid, @NotNull).<br>" +
                            "C006: 잘못된 DM 대상(자기 자신과 DM 등)."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "C002: 매장 경계 권한 없음(요청자/대상자).<br>" +
                            "C003: 기존 DM 방은 있지만 요청자가 활성 멤버가 아님(left_at 존재)."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "S001: 매장을 찾을 수 없음.<br>" +
                            "U001: 요청자 또는 대상 사용자 찾을 수 없음."
            )
    })
    ApiResponse<ChatRoomResponseDto.RoomDetail> createOrGetDirectRoom(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Valid @RequestBody ChatRoomRequestDto.CreateDirect request
    );

    @Operation(
            summary = "그룹 방 생성",
            description = "매장 내 그룹 채팅방을 생성하고 요청자를 OWNER로 등록합니다. " +
                    "초대 멤버는 중복 제거 후 처리되며 요청자는 MEMBER로 중복 저장되지 않습니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "그룹 방 생성 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "G002: 요청값 검증 실패(@Valid, @NotBlank)."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "C002: 매장 경계 권한 없음(요청자 또는 초대 대상)."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "S001: 매장을 찾을 수 없음.<br>" +
                            "U001: 요청자 또는 초대 대상 사용자 찾을 수 없음."
            )
    })
    ApiResponse<ChatRoomResponseDto.RoomDetail> createGroupRoom(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Valid @RequestBody ChatRoomRequestDto.CreateGroup request
    );

    @Operation(
            summary = "봇 방 생성 또는 재사용",
            description = "매장 단위 BOT 방을 생성하거나 기존 BOT 방을 재사용합니다. " +
                    "BOT 방의 sortPriority는 최상단 정책값으로 유지됩니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "BOT 방 생성/재사용 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "G002: 요청값 검증 실패(@Valid, @NotBlank)."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "C002: 매장 경계 권한 없음."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "S001: 매장을 찾을 수 없음.<br>" +
                            "U001: 요청자 사용자 찾을 수 없음."
            )
    })
    ApiResponse<ChatRoomResponseDto.RoomDetail> createOrGetBotRoom(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Valid @RequestBody ChatRoomRequestDto.CreateBot request
    );

    @Operation(
            summary = "그룹 방 이름 수정",
            description = "OWNER 권한을 가진 사용자만 그룹 방 이름을 수정할 수 있습니다. " +
                    "GROUP 타입 방이 아니면 수정할 수 없습니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "방 이름 수정 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "G002: 요청값 검증 실패(@Valid, @NotBlank).<br>" +
                            "C008: GROUP 타입이 아닌 방 이름 수정 시도."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "C003: 활성 멤버가 아님.<br>" +
                            "C002: OWNER 권한 없음."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "C001: 채팅방을 찾을 수 없음."
            )
    })
    ApiResponse<ChatRoomResponseDto.RoomDetail> updateRoomName(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "채팅방 ID", example = "100") @PathVariable Long roomId,
            @Valid @RequestBody ChatRoomRequestDto.UpdateName request
    );

    @Operation(
            summary = "내 방 목록 조회",
            description = "특정 매장 내에서 현재 사용자가 참여 중인 방 목록을 조회합니다. " +
                    "정렬은 sortPriority DESC 후 최근 메시지 시각 DESC 순서를 따릅니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "방 목록 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "C002: 매장 경계 권한 없음."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "S001: 매장을 찾을 수 없음."
            )
    })
    ApiResponse<List<ChatRoomResponseDto.RoomSummary>> getRooms(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId
    );

    @Operation(
            summary = "방 상세 조회",
            description = "현재 사용자가 참여 중인 단일 채팅방의 상세 정보를 조회합니다. " +
                    "활성 멤버가 아니면 접근할 수 없습니다."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "방 상세 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "C003: 채팅방의 활성 멤버가 아님."
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "C001: 채팅방을 찾을 수 없음."
            )
    })
    ApiResponse<ChatRoomResponseDto.RoomDetail> getRoom(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "채팅방 ID", example = "100") @PathVariable Long roomId
    );
}
