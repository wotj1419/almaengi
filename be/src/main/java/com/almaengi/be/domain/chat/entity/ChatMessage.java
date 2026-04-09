package com.almaengi.be.domain.chat.entity;

import com.almaengi.be.domain.chat.type.ChatMessageType;
import com.almaengi.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    // SYSTEM 메시지는 sender가 null일 수 있으므로 nullable
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 20)
    private ChatMessageType messageType;
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    @Column(name = "file_url", length = 255)
    private String fileUrl;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meta_json")
    private String metaJson;
    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;
    @Column(name = "read_count", nullable = false)
    private Integer readCount = 0;
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    private ChatMessage(ChatRoom room, User sender, ChatMessageType messageType, String content, String fileUrl,
            String metaJson, LocalDateTime sentAt, Integer readCount, Boolean isDeleted, LocalDateTime deletedAt) {
        this.room = room;
        this.sender = sender;
        this.messageType = messageType;
        this.content = content;
        this.fileUrl = fileUrl;
        this.metaJson = metaJson;
        this.sentAt = sentAt;
        this.readCount = readCount;
        this.isDeleted = isDeleted;
        this.deletedAt = deletedAt;
    }

    // 기본 텍스트 메시지 생성 팩토리
    public static ChatMessage createText(ChatRoom room, User sender, String content) {
        return ChatMessage.builder()
                .room(room)
                .sender(sender)
                .messageType(ChatMessageType.TEXT)
                .content(content)
                .fileUrl(null)
                .metaJson(null)
                .sentAt(LocalDateTime.now())
                .readCount(0)
                .isDeleted(false)
                .deletedAt(null)
                .build();
    }

    // 봇 답변도 현재 정책상 일반 텍스트와 동일하게 저장
    // sender는 botUserId에 해당하는 User를 사용
    public static ChatMessage createBotText(ChatRoom room, User botUser, String content) {
        return createBotText(room, botUser, content, null);
    }
    public static ChatMessage createBotText(ChatRoom room, User botUser, String content, String metaJson) {
        return ChatMessage.builder()
                .room(room)
                .sender(botUser)
                .messageType(ChatMessageType.TEXT)
                .content(content)
                .fileUrl(null)
                .metaJson(metaJson)
                .sentAt(LocalDateTime.now())
                .readCount(0)
                .isDeleted(false)
                .deletedAt(null)
                .build();
    }

    // fallback 메시지도 메타 저장 가능하도록 오버로드 제공
    public static ChatMessage createFallbackText(ChatRoom room, User botUser, String fallbackText) {
        return createFallbackText(room, botUser, fallbackText, null);
    }
    public static ChatMessage createFallbackText(ChatRoom room, User botUser, String fallbackText, String metaJson) {
        return createBotText(room, botUser, fallbackText, metaJson);
    }
}
