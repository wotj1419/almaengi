package com.almaengi.be.domain.notification.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

public class FcmRequestDto {

    @Getter
    @NoArgsConstructor
    public static class TokenRegister {
        private String deviceToken;
    }

    @Getter
    @NoArgsConstructor
    public static class NotificationRead {
        private List<Long> notificationIds;
    }
}
