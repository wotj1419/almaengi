package com.almaengi.be.domain.chat.dto;

import com.almaengi.be.domain.chat.entity.ChatMessage;
import com.almaengi.be.domain.chat.entity.ChatRoom;
import com.almaengi.be.domain.chat.entity.ChatRoomMember;
import com.almaengi.be.domain.chat.type.ChatMemberRole;
import com.almaengi.be.domain.chat.type.ChatRoomType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

public class ChatRoomResponseDto {

    @Getter
    @Builder
    @Schema(name = "ChatRoomSummary", description = "채팅방 목록 조회용 요약 정보")
    public static class RoomSummary {
        @Schema(description = "채팅방 ID", example = "100")
        private Long roomId;
        @Schema(description = "채팅방 타입(DM, GROUP, BOT)", example = "GROUP")
        private ChatRoomType roomType;
        @Schema(description = "채팅방 이름", example = "오픈조 마감 인수인계")
        private String name;
        @Schema(description = "정렬 우선순위(클수록 상단)", example = "10000")
        private Integer sortPriority;
        @Schema(description = "최근 메시지 ID", example = "999")
        private Long lastMessageId;
        @Schema(description = "최근 메시지 미리보기", example = "내일 오픈 30분 일찍 부탁드립니다.")
        private String lastMessagePreview;
        @Schema(description = "최근 메시지 시각", type = "string", example = "2026-03-20T09:30:00")
        private LocalDateTime lastMessageAt;
        @Schema(description = "읽지 않은 메시지 수", example = "3")
        private long unreadCount;
        @Schema(description = "현재 활성 멤버 수", example = "5")
        private int memberCount;

        public static RoomSummary of(ChatRoom room, ChatMessage lastMessage, int memberCount, long unreadCount) {
            return RoomSummary.builder()
                    .roomId(room.getId())
                    .roomType(room.getRoomType())
                    .name(room.getName())
                    .sortPriority(room.getSortPriority())
                    .lastMessageId(lastMessage != null ? lastMessage.getId() : room.getLastMessageId())
                    .lastMessagePreview(lastMessage != null ? lastMessage.getContent() : null)
                    .lastMessageAt(room.getLastMessageAt())
                    .unreadCount(unreadCount)
                    .memberCount(memberCount)
                    .build();
        }
    }

    @Getter
    @Builder
    @Schema(name = "ChatRoomDetail", description = "단일 채팅방 상세 정보")
    public static class RoomDetail {
        @Schema(description = "채팅방 ID", example = "100")
        private Long roomId;
        @Schema(description = "소속 매장 ID", example = "1")
        private Long storeId;
        @Schema(description = "채팅방 타입(DM, GROUP, BOT)", example = "BOT")
        private ChatRoomType roomType;
        @Schema(description = "채팅방 이름", example = "AI 업무 도우미")
        private String name;
        @Schema(description = "정렬 우선순위", example = "10000")
        private Integer sortPriority;
        @Schema(description = "아카이브 여부", example = "false")
        private Boolean isArchived;
        @Schema(description = "최근 메시지 ID", example = "999")
        private Long lastMessageId;
        @Schema(description = "최근 메시지 시각", type = "string", example = "2026-03-20T09:30:00")
        private LocalDateTime lastMessageAt;
        @Schema(description = "현재 활성 멤버 목록")
        private List<MemberInfo> members;

        public static RoomDetail of(ChatRoom room, List<MemberInfo> members) {
            return RoomDetail.builder()
                    .roomId(room.getId())
                    .storeId(room.getStore().getId())
                    .roomType(room.getRoomType())
                    .name(room.getName())
                    .sortPriority(room.getSortPriority())
                    .isArchived(room.getIsArchived())
                    .lastMessageId(room.getLastMessageId())
                    .lastMessageAt(room.getLastMessageAt())
                    .members(members)
                    .build();
        }
    }

    @Getter
    @Builder
    @Schema(name = "ChatRoomMemberInfo", description = "채팅방 멤버 정보")
    public static class MemberInfo {
        @Schema(description = "사용자 ID", example = "23")
        private Long userId;
        @Schema(description = "사용자 이름", example = "김알바")
        private String name;
        @Schema(description = "방 내 권한(OWNER, MEMBER)", example = "MEMBER")
        private ChatMemberRole role;
        @Schema(description = "입장 시각", type = "string", example = "2026-03-20T09:00:00")
        private LocalDateTime joinedAt;

        public static MemberInfo from(ChatRoomMember member) {
            return MemberInfo.builder()
                    .userId(member.getUser().getId())
                    .name(member.getUser().getName())
                    .role(member.getMemberRole())
                    .joinedAt(member.getJoinedAt())
                    .build();
        }
    }
}
