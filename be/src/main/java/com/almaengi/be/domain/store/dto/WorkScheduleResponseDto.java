package com.almaengi.be.domain.store.dto;

import com.almaengi.be.domain.store.entity.WorkSchedule;
import com.almaengi.be.domain.store.type.DayOfWeek;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalTime;
import java.util.List;

public class WorkScheduleResponseDto {

    @Schema(description = "주간 근무 스케줄 정보 응답 DTO")
    @Getter
    @Builder
    public static class ScheduleInfo {
        @Schema(description = "스케줄 ID", example = "1")
        private Long scheduleId;

        @Schema(description = "직원(연결) ID", example = "3")
        private Long employeeId;
        @Schema(description = "직원 이름", example = "김싸피")
        private String employeeName;

        @Schema(description = "요일 (SUN=일, MON=월, TUE=화, WED=수, THU=목, FRI=금, SAT=토)", example = "MON")
        private DayOfWeek dayOfWeek;
        @Schema(description = "근무 시작 시간", example = "09:00")
        private LocalTime startTime;
        @Schema(description = "근무 종료 시간", example = "18:00")
        private LocalTime endTime;
        @Schema(description = "휴게 시간 (분)", example = "60")
        private int breakMinutes;

        public static ScheduleInfo from(WorkSchedule workSchedule) {
            return ScheduleInfo.builder()
                    .scheduleId(workSchedule.getId())
                    .employeeId(workSchedule.getEmployee().getId())
                    .employeeName(workSchedule.getEmployee().getUser().getName())
                    .dayOfWeek(workSchedule.getDayOfWeek())
                    .startTime(workSchedule.getStartTime())
                    .endTime(workSchedule.getEndTime())
                    .breakMinutes(workSchedule.getBreakMinutes())
                    .build();
        }
    }

    @Schema(description = "주간 근무 스케줄 일괄 등록 결과 DTO")
    @Getter
    @Builder
    public static class BulkResult {
        @Schema(description = "등록 성공한 스케줄 목록")
        private List<ScheduleInfo> created;

        @Schema(description = "시간 충돌로 등록 실패한 스케줄 목록 (요일 + 시간대)")
        private List<String> conflicts;
    }

}
