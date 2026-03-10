package com.almaengi.be.domain.attendance.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 출퇴근(근태) 상태를 정의하는 Enum입니다.
 */
@Getter
@RequiredArgsConstructor
public enum AttendanceStatus {
    SCHEDULED("예정"),
    ON_TIME("정상 출근"),
    LATE("지각"),
    ABSENT("결근"),
    EARLY_LEAVE("조퇴"),
    AUTHORIZED_ABSENCE("공인 결근(대타 등)");

    private final String description;
}
