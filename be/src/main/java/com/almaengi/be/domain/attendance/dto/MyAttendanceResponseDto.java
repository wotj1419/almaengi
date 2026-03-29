package com.almaengi.be.domain.attendance.dto;

import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalTime;

/**
 * 알바생 본인의 오늘 출퇴근 현황 응답 DTO입니다.
 *
 * - currentStatus: Redis 기반 현재 상태 (WORKING / LATE / ABSENT / null=출근 전)
 * - scheduledEndTime: DB 기반 예정 퇴근 시각 (null 가능)
 */
@Getter
@Builder
public class MyAttendanceResponseDto {

    private AttendanceStatus currentStatus;
    private LocalTime scheduledEndTime;
}
