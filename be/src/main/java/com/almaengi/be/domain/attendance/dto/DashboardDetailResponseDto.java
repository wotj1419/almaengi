package com.almaengi.be.domain.attendance.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalTime;
import java.util.List;

/**
 * 대시보드 상태별 직원 목록 응답 DTO입니다.
 * 특정 상태(working/late/absent)의 직원 정보를 반환합니다.
 * Redis SMEMBERS로 ID 조회 → DB에서 직원 정보를 가져옵니다.
 */
@Getter
@Builder
public class DashboardDetailResponseDto {
    private String status;
    private List<DashboardEmployeeDto> employees;

    /**
     * 대시보드 직원 정보 DTO입니다.
     * 직원 이름, 전화번호, 예정 출퇴근 시간을 포함합니다.
     */
    @Getter
    @Builder
    public static class DashboardEmployeeDto {
        private Long employeeId;
        private String userName;
        private String phone;
        private LocalTime scheduledStartTime;
        private LocalTime scheduledEndTime;
    }
}
