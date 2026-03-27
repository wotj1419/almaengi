package com.almaengi.be.domain.attendance.type;

/**
 * 출퇴근 API 응답 유형입니다.
 *
 * - CLOCK_IN: 출근 완료
 * - CLOCK_OUT: 퇴근 완료
 * - OVERTIME_CHECK: 연장근무 확인 필요 (퇴근시각 경과 + overtimeConfirm 미전달 시)
 */
public enum AttendanceResultType {
    CLOCK_IN,
    CLOCK_OUT,
    OVERTIME_CHECK
}