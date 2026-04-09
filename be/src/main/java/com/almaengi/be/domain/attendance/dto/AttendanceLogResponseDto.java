package com.almaengi.be.domain.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * 근태 로그 조회 응답 DTO입니다.
 * 특정 매장의 특정 날짜 근태 기록을 반환합니다.
 * 당일은 조회 불가하며, 전일까지만 조회할 수 있습니다.
 */
@Getter
@Builder
public class AttendanceLogResponseDto {

    private Long storeId;
    private LocalDate date;
    private List<AttendanceLogDto> attendances;

    private Long all;        // 전체직원
    private Long working;    // 출근
    private Long late;       // 지각자
    private Long absent;     // 결근자

    /**
     * 직원별 근태 기록 DTO입니다.
     * 예정 근무시간, 실제 출퇴근 시각, 근태 상태, 연장근무 여부를 포함합니다.
     */
    @Getter
    @Builder
    public static class AttendanceLogDto {
        private Long employeeId;
        private String employeeName;
        private LocalTime scheduledStartTime;
        private LocalTime scheduledEndTime;
        private LocalDateTime clockIn;
        private LocalDateTime clockOut;
        private String status;
        private Boolean overtime;
    }
}
