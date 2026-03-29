package com.almaengi.be.domain.attendance.dto;

import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 알바생 본인의 특정 날짜 근태 상세 응답 DTO입니다.
 *
 * - exists=false 이면 해당 날짜 근태 레코드가 없음을 의미합니다.
 * - workedMinutes는 clockIn~clockOut에서 breakMinutes를 차감해 계산합니다.
 */
@Getter
@Builder
public class MyAttendanceLogResponseDto {
    private Long storeId;
    private Long employeeId;
    private String employeeName;
    private LocalDate date;

    private LocalTime scheduledStartTime;
    private LocalTime scheduledEndTime;
    private LocalDateTime clockIn;
    private LocalDateTime clockOut;
    private AttendanceStatus status;
    private Boolean overtime;
    private Integer breakMinutes;
    private Integer workedMinutes;

    private Boolean exists;
}
