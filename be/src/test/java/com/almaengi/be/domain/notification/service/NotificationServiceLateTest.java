package com.almaengi.be.domain.notification.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.notification.entity.Notification;
import com.almaengi.be.domain.notification.repository.NotificationRepository;
import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.entity.UserFcmToken;
import com.almaengi.be.domain.user.repository.UserFcmTokenRepository;
import com.almaengi.be.domain.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService.sendLateNotification 단위 테스트")
class NotificationServiceLateTest {

    @InjectMocks
    private NotificationService notificationService;

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserFcmTokenRepository userFcmTokenRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FcmService fcmService;

    private User owner;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .loginType(LoginType.LOCAL)
                .name("김사장")
                .email("owner@test.com")
                .build();
        ReflectionTestUtils.setField(owner, "id", 1L);
    }

    @Nested
    @DisplayName("sendLateNotification()")
    class SendLateNotificationTest {

        @Test
        @DisplayName("최초 알림: DB에 저장하고 FCM 푸시를 전송한다")
        void sendFirstNotification() {
            // given
            when(notificationRepository.existsByReceiverIdAndTypeAndTargetIdAndCreatedAtGreaterThanEqual(
                    eq(1L), eq(NotificationType.LATE), eq(50L), any(LocalDateTime.class)))
                    .thenReturn(false);

            UserFcmToken token = UserFcmToken.builder()
                    .user(owner)
                    .deviceToken("fcm_token_123")
                    .build();
            when(userFcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token));

            // when
            notificationService.sendLateNotification(owner, 50L, "김알바", "알맹이카페");

            // then
            verify(notificationRepository, times(1)).save(argThat(notification ->
                    notification.getReceiver().equals(owner) &&
                    notification.getType() == NotificationType.LATE &&
                    notification.getTargetId().equals(50L) &&
                    notification.getTitle().equals("지각 알림") &&
                    notification.getBody().equals("김알바님이 지각 중입니다. (알맹이카페)")
            ));
            verify(fcmService, times(1)).sendPushNotification(
                    "fcm_token_123", "지각 알림", "김알바님이 지각 중입니다. (알맹이카페)",
                    "LATE", "50");
        }

        @Test
        @DisplayName("중복 알림: 당일 이미 발송된 경우 스킵한다")
        void skipWhenAlreadySent() {
            // given
            when(notificationRepository.existsByReceiverIdAndTypeAndTargetIdAndCreatedAtGreaterThanEqual(
                    eq(1L), eq(NotificationType.LATE), eq(50L), any(LocalDateTime.class)))
                    .thenReturn(true);

            // when
            notificationService.sendLateNotification(owner, 50L, "김알바", "알맹이카페");

            // then
            verify(notificationRepository, never()).save(any());
            verify(fcmService, never()).sendPushNotification(any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("FCM 토큰이 없으면 DB에는 저장하고 FCM은 전송하지 않는다")
        void saveButSkipFcmWhenNoToken() {
            // given
            when(notificationRepository.existsByReceiverIdAndTypeAndTargetIdAndCreatedAtGreaterThanEqual(
                    eq(1L), eq(NotificationType.LATE), eq(50L), any(LocalDateTime.class)))
                    .thenReturn(false);
            when(userFcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of());

            // when
            notificationService.sendLateNotification(owner, 50L, "김알바", "알맹이카페");

            // then
            verify(notificationRepository, times(1)).save(any(Notification.class));
            verify(fcmService, never()).sendPushNotification(any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("FCM 토큰이 여러 개면 모든 기기에 푸시를 전송한다")
        void sendToMultipleDevices() {
            // given
            when(notificationRepository.existsByReceiverIdAndTypeAndTargetIdAndCreatedAtGreaterThanEqual(
                    eq(1L), eq(NotificationType.LATE), eq(50L), any(LocalDateTime.class)))
                    .thenReturn(false);

            UserFcmToken token1 = UserFcmToken.builder().user(owner).deviceToken("token_1").build();
            UserFcmToken token2 = UserFcmToken.builder().user(owner).deviceToken("token_2").build();
            when(userFcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token1, token2));

            // when
            notificationService.sendLateNotification(owner, 50L, "김알바", "알맹이카페");

            // then
            verify(fcmService, times(2)).sendPushNotification(any(), any(), any(), any(), any());
            verify(fcmService).sendPushNotification("token_1", "지각 알림",
                    "김알바님이 지각 중입니다. (알맹이카페)", "LATE", "50");
            verify(fcmService).sendPushNotification("token_2", "지각 알림",
                    "김알바님이 지각 중입니다. (알맹이카페)", "LATE", "50");
        }
    }
}
