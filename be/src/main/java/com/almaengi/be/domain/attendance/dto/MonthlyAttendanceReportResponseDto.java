package com.almaengi.be.domain.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 월별 근태 리포트 응답 DTO입니다.
 *
 * - employees: 직원별 근태 요약 (출근수 내림차순 → 지각수 오름차순 정렬)
 * - diligentEmployees: 성실왕 (해당 월 결근 0인 직원)
 * - lateChampions: 지각왕 (해당 월 지각 최다 직원, 동점 시 복수)
 */
@Getter
@Builder
public class MonthlyAttendanceReportResponseDto {

    private String targetMonth;
    private List<EmployeeAttendanceSummary> employees;
    private List<EmployeeInfo> diligentEmployees;
    private List<EmployeeInfo> lateChampions;

    /**
     * 직원별 월간 근태 집계 항목입니다.
     */
    @Getter
    @Builder
    public static class EmployeeAttendanceSummary {
        private Long employeeId;
        private String employeeName;
        /** 출근수 (지각 포함, clockIn != null인 기록) */
        private int attendanceCount;
        /** 지각수 (status == LATE) */
        private int lateCount;
        /** 결근수 (status == ABSENT) */
        private int absentCount;
        /** 총 근무시간 (분 단위, clockOut - clockIn - breakMinutes) */
        private int totalWorkMinutes;
    }

    /**
     * 성실왕/지각왕 표시용 직원 정보입니다.
     */
    @Getter
    @Builder
    public static class EmployeeInfo {
        private Long employeeId;
        private String employeeName;
    }
}
