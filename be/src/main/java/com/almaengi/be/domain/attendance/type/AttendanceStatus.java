package com.almaengi.be.domain.attendance.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 출퇴근(근태) 상태를 정의하는 Enum입니다.
 *
 * DB 상태 흐름: WAITING → WORKING (정상 출근) / LATE (지각 출근) / ABSENT (결근)
 * Redis 상태: 출근하면 working (지각 여부 무관), 미출근 지각이면 late, 결근이면 absent
 *
 * - WAITING: 일일 배치에서 Attendance 사전 생성 시 초기 상태
 * - WORKING: 정상 출근 (DB 이력)
 * - LATE: 지각 출근 (DB 이력) — Redis에서는 working으로 표시 (현재 근무 중)
 * - ABSENT: 퇴근시각까지 미출근 시 결근 확정
 */
@Getter
@RequiredArgsConstructor
public enum AttendanceStatus {
    WAITING("대기"),
    WORKING("근무 중"),
    LATE("지각"),
    ABSENT("결근"),
    AUTHORIZED_ABSENCE("공인 결근(대타 등)");

    private final String description;
}
