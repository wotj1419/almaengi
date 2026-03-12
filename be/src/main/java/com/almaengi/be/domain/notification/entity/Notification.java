package com.almaengi.be.domain.notification.entity;

import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notifications")
public class Notification extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    private User receiver;

    @Column(nullable = false)
    private String title;
    @Column(nullable = false)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationType type;

    // 알림 클릭 시 이동해야 할 대상의 고유 ID(예: 12번 경매글이라면 12)
    // 화면 이동이 필요 없는 단순 공지 알림이라면 null
    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead;

    @Builder
    public Notification(User receiver, String title, String body, NotificationType type, Long targetId) {
        this.receiver = receiver;
        this.title = title;
        this.body = body;
        this.type = type;
        this.targetId = targetId;
        this.isRead = false;
    }

    // 알림함 API에서 이 알림을 클릭했을 때, 호출
    public void markAsRead() {
        this.isRead = true;
    }
}
