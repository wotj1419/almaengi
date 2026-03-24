package com.almaengi.be.domain.chat.entity;

import com.almaengi.be.domain.chat.type.ChatMemberRole;
import com.almaengi.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "chat_room_members",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_chat_room_members", columnNames = {"room_id", "user_id"})
        }
)
@Getter
@NoArgsConstructor(access= AccessLevel.PROTECTED)
public class ChatRoomMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_member_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", nullable = false, length = 20)
    private ChatMemberRole memberRole = ChatMemberRole.MEMBER;
    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;
    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;
    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;
    @Column(name = "mute_until")
    private LocalDateTime muteUntil;

    @Builder
    public ChatRoomMember(ChatRoom room, User user, ChatMemberRole memberRole, LocalDateTime joinedAt) {
        this.room = room;
        this.user = user;
        this.memberRole = (memberRole != null) ? memberRole : ChatMemberRole.MEMBER;
        this.joinedAt = (joinedAt != null) ? joinedAt : LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if(joinedAt == null) joinedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return leftAt == null;
    }

    public void leaveNow() {
        this.leftAt = LocalDateTime.now();
    }

    public void updateLastRead(Long messageId, LocalDateTime readAt) {
        this.lastReadMessageId = messageId;
        this.lastReadAt = (readAt != null) ? readAt : LocalDateTime.now();
    }

    public void muteUntil(LocalDateTime muteUntil) {
        this.muteUntil = muteUntil;
    }
}
