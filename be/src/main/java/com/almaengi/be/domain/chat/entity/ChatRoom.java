package com.almaengi.be.domain.chat.entity;

import com.almaengi.be.domain.chat.type.ChatRoomType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false)
    private ChatRoomType roomType;

    @Column(length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "last_message_id")
    private Long lastMessageId;
    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;


    @Column(name = "sort_priority", nullable = false)
    private Integer sortPriority = 0;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @Builder
    public ChatRoom(Store store, ChatRoomType roomType, String name, User createdBy, Integer sortPriority) {
        this.store = store;
        this.roomType = roomType;
        this.name = name;
        this.createdBy = createdBy;
        this.sortPriority = (sortPriority != null) ? sortPriority : 0;
        this.isArchived = false;
    }

    // 메시지 저장 직후, 방의 최근 메세지 포인터 갱신.
    public void updateLastMessagePointer(Long messageId, LocalDateTime lastMessageAt) {
        this.lastMessageId = messageId;
        this.lastMessageAt = lastMessageAt;
    }

    public void rename(String name) {
        if(name != null && !name.isBlank()) this.name = name;
    }

    public void archive() {
        this.isArchived = true;
    }

    public void setSortPriority(Integer sortPriority) {
        this.sortPriority = (sortPriority != null) ? sortPriority : 0;
    }
}
