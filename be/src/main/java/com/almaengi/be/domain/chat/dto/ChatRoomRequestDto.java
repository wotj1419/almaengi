package com.almaengi.be.domain.chat.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

public class ChatRoomRequestDto {

    @Getter
    @Schema(name = "ChatRoomCreateDirect", description = "DM 채팅방 생성/재사용 요청 DTO")
    public static class CreateDirect {
        @Schema(description = "DM 상대 사용자 ID", example = "23")
        @NotNull
        private Long targetUserId; // DM 상대방 userId
    }

    @Getter
    @Schema(name = "ChatRoomCreateGroup", description = "그룹 채팅방 생성 요청 DTO")
    public static class CreateGroup {
        @Schema(description = "생성할 그룹방 이름", example = "오픈조 마감 인수인계")
        @NotBlank
        private String name; // 방 이름

        @Schema(description = "초대할 사용자 ID 목록(요청자는 자동 OWNER 등록)", example = "[2, 3, 5]")
        private List<Long> memberUserIds; // 초대할 멤버 userId 목록
    }

    @Getter
    @Schema(name = "ChatRoomCreateBot", description = "챗봇 채팅방 생성/재사용 요청 DTO")
    public static class CreateBot {
        @Schema(description = "챗봇방 표시 이름", example = "AI 업무 도우미")
        @NotBlank
        private String name; // 방 이름 변경
    }

    @Getter
    @Schema(name = "ChatRoomUpdateName", description = "그룹 채팅방 이름 수정 요청 DTO")
    public static class UpdateName {
        @Schema(description = "변경할 채팅방 이름", example = "주말 근무자 공지방")
        @NotBlank
        private String name;
    }
}
