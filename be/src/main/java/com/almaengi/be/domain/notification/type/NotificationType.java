package com.almaengi.be.domain.notification.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {
    AUCTION("시간 경매 알림"),
    SCHEDULE("스케쥴 알림"),
    SALARY("급여 알림"),
    LATE("지각 알림");

    private final String description;
}
