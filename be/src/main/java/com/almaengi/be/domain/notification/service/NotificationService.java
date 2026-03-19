package com.almaengi.be.domain.notification.service;

import com.almaengi.be.domain.notification.dto.FcmResponseDto;
import com.almaengi.be.domain.notification.entity.Notification;
import com.almaengi.be.domain.notification.repository.NotificationRepository;
import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.entity.UserFcmToken;
import com.almaengi.be.domain.user.repository.UserFcmTokenRepository;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {
    private final UserFcmTokenRepository userFcmTokenRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final FcmService fcmService;

    @Transactional
    public void registerFcmToken(Long userId, String deviceToken) {
        // 1. 이미 db에 존재하는 토큰인지 확인
        userFcmTokenRepository.findByDeviceToken(deviceToken)
                .ifPresentOrElse(
                        userFcmToken -> {
                            userFcmToken.updateLastActiveAt();
                            log.info("FCM Token 시간 갱신(user: {}, token: {})", userId, deviceToken);
                        },
                        () -> {
                            User user = userRepository.findById(userId)
                                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

                            UserFcmToken newToken = UserFcmToken.builder()
                                    .user(user)
                                    .deviceToken(deviceToken)
                                    .build();

                            userFcmTokenRepository.save(newToken);
                            log.info("FCM 기기 Token 등록(user: {}, token: {})", userId, deviceToken);
                        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendNotification(User receiver, NotificationType type, String title, String body, Long targetId) {
        List<UserFcmToken> tokens = userFcmTokenRepository.findAllByUserId(receiver.getId());

        Notification notification = Notification.builder()
                .receiver(receiver)
                .title(title)
                .body(body)
                .type(type)
                .targetId(targetId)
                .build();
        notificationRepository.save(notification);

        try {
            if(tokens.isEmpty()) {
                log.info("해당 유저(id:{})의 FCM 토큰이 없어 알림 발송이 취소되었습니다.", receiver.getId());
                return;
            }

            for(UserFcmToken token : tokens) {
                fcmService.sendPushNotification(token.getDeviceToken(), title, body, type.toString(), String.valueOf(targetId));
            }
        } catch(Exception e) {
            // 알림 발송이 메인 로직을 정지시키지 못하도록 예외 삼키기.
            log.warn("알림 발송 실패 - receiverId: {}, type: {}, targetId: {}, reason: {}",
                    receiver.getId(), type, targetId, e.getMessage(), e);
        }

    }

    // 특정 유저의 알림함 조회
    @Transactional
    public List<FcmResponseDto.NotificationDto> getNotificationHistory(Long userId) {
        List<Notification> notifications = notificationRepository.findAllByReceiverIdOrderByCreatedAtDesc(userId);

        return notifications.stream()
                .map(FcmResponseDto.NotificationDto::from)
                .toList();
    }

    // 알림 단건 읽음 처리
    @Transactional
    public void readNotification(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if(!notification.getReceiver().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }

        notification.markAsRead();
    }

    //  다중 알림 읽음 처리
    @Transactional
    public void readNotifications(Long userId, List<Long> notificationIds) {
        List<Notification> notifications = notificationRepository.findAllById(notificationIds);

        notifications.forEach(notification -> {
            if(notification.getReceiver().getId().equals(userId)) {
                notification.markAsRead();
            }
        });
    }
}
