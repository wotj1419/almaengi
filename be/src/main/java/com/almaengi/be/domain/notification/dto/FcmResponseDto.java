package com.almaengi.be.domain.notification.dto;

import com.almaengi.be.domain.notification.entity.Notification;
import com.almaengi.be.domain.notification.type.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class FcmResponseDto {

    @Getter
    @Builder
    public static class NotificationDto {
        private Long id;
        private String title;
        private String body;
        private NotificationType type;
        private Long targetId;
        private Boolean isRead;
        private LocalDateTime createdAt;

        public static FcmResponseDto.NotificationDto from(Notification notification) {
            return FcmResponseDto.NotificationDto.builder()
                    .id(notification.getId())
                    .title(notification.getTitle())
                    .body(notification.getBody())
                    .type(notification.getType())
                    .targetId(notification.getTargetId())
                    .isRead(notification.getIsRead())
                    .createdAt(notification.getCreatedAt())
                    .build();
        }
    }
}
