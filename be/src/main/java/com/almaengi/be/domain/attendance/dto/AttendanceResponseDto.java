package com.almaengi.be.domain.attendance.dto;

import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 출퇴근 API 응답 DTO입니다.
 *
 * - type: "CLOCK_IN" (출근) 또는 "CLOCK_OUT" (퇴근)
 * - message: 사용자 안내 메시지 ("출근이 기록되었습니다." / "퇴근이 기록되었습니다.")
 */
@Getter
@Builder
public class AttendanceResponseDto {

    private String type;            // CLOCK_IN 또는 CLOCK_OUT
    private Long attendanceId;
    private LocalDateTime clockIn;
    private LocalDateTime clockOut;
    private AttendanceStatus status; // WORKING, LATE 등
    private Boolean overtime;        // 연장근무 여부
    private LocalTime scheduledEndTime; // 예정 퇴근 시각
    private String message;
}
