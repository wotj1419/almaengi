package com.almaengi.be.domain.store.dto;

import com.almaengi.be.domain.store.type.DayOfWeek;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

public class WorkScheduleRequestDto {

    @Schema(name = "WorkScheduleCreate", description = "주간 근무 스케줄 등록 요청 DTO (사장님용)")
    @Getter
    public static class Create {
        @Schema(description = "요일 (SUN=일, MON=월, TUE=화, WED=수, THU=목, FRI=금, SAT=토)", example = "MON")
        @NotNull(message = "요일을 입력해주세요")
        private DayOfWeek dayOfWeek;

        @Schema(description = "근무 시작 시간 (HH:mm 형식)", example = "09:00")
        @NotBlank(message = "근무 시작 시간을 입력해주세요.")
        private String startTime;
        @Schema(description = "근무 종료 시간 (HH:mm 형식)", example = "18:00")
        @NotBlank(message = "근무 종료 시간을 입력해주세요.")
        private String endTime;

        @Schema(description = "휴게 시간 (분 단위, 기본 0)", example = "60")
        private Integer breakMinutes;
    }

    @Schema(name = "WorkScheduleUpdate", description = "주간 근무 스케줄 수정 요청 DTO (사장님용)")
    @Getter
    public static class Update {
        @Schema(description = "변경할 요일", example = "TUE")
        private DayOfWeek dayOfWeek;

        @Schema(description = "변경할 근무 시작 시간 (HH:mm 형식)", example = "10:00")
        private String startTime;
        @Schema(description = "변경할 근무 종료 시간 (HH:mm 형식)", example = "19:00")
        private String endTime;

        @Schema(description = "변경할 휴게 시간 (분 단위)", example = "30")
        private Integer breakMinutes;
    }

    @Schema(name = "WorkScheduleCreateBulk", description = "주간 근무 스케줄 일괄 등록 요청 DTO")
    @Getter
    public static class CreateBulk {
        @Schema(description = "등록할 스케줄 목록")
        @NotNull(message = "스케줄 목록을 입력해주세요.")
        @NotEmpty(message = "스케줄 목록이 비어있습니다.")
        private List<Create> schedules;
    }
}
