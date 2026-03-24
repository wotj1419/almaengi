package com.almaengi.be.domain.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.almaengi.be.domain.notification.repository.NotificationRepository;
import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.user.repository.UserFcmTokenRepository;
import com.almaengi.be.domain.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService.isAlreadySentToday 단위 테스트")
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

    @Nested
    @DisplayName("isAlreadySentToday()")
    class IsAlreadySentTodayTest {

        @Test
        @DisplayName("당일 동일 알림이 없으면 false를 반환한다")
        void returnFalseWhenNotSent() {
            // given
            when(notificationRepository.existsByReceiverIdAndTypeAndTargetIdAndCreatedAtGreaterThanEqual(
                    eq(1L), eq(NotificationType.LATE), eq(50L), any(LocalDateTime.class)))
                    .thenReturn(false);

            // when
            boolean result = notificationService.isAlreadySentToday(1L, NotificationType.LATE, 50L);

            // then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("당일 동일 알림이 있으면 true를 반환한다")
        void returnTrueWhenAlreadySent() {
            // given
            when(notificationRepository.existsByReceiverIdAndTypeAndTargetIdAndCreatedAtGreaterThanEqual(
                    eq(1L), eq(NotificationType.LATE), eq(50L), any(LocalDateTime.class)))
                    .thenReturn(true);

            // when
            boolean result = notificationService.isAlreadySentToday(1L, NotificationType.LATE, 50L);

            // then
            assertThat(result).isTrue();
        }
    }
}
