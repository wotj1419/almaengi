package com.almaengi.be.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "user_fcm_token")
public class UserFcmToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_id")
    private Long id;

    // 하나의 user가 여러 기기를 가질 수 있음
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 기기 고유 토큰 값. 중복 저장을 막기 위해 unique 제약조건
    @Column(name = "device_token", nullable = false, unique = true)
    private String deviceToken;

    // 활동 시간 기록(오래된 토큰 정리)
    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    @Builder
    public UserFcmToken(User user, String deviceToken) {
        this.user = user;
        this.deviceToken = deviceToken;
        this.lastActiveAt = LocalDateTime.now();
    }

    // 디바이스 활성화 시간 갱신용 메서드
    public void updateLastActiveAt() {
        this.lastActiveAt = LocalDateTime.now();
    }
}
