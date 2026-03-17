package com.almaengi.be.domain.store.controller.docs;

import com.almaengi.be.domain.store.dto.WorkScheduleRequestDto;
import com.almaengi.be.domain.store.dto.WorkScheduleResponseDto;
import com.almaengi.be.domain.store.type.DayOfWeek;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "WorkSchedule API", description = "직원 주간 고정 근무 스케줄 관리 API")
public interface WorkScheduleControllerDocs {

    @Operation(summary = "직원 주간 스케줄 단건 등록",
            description = "사장님이 특정 직원의 주간 고정 근무 스케줄을 1건 등록합니다.")
    ApiResponse<WorkScheduleResponseDto.ScheduleInfo> addSchedule(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long employeeId,
            @Valid @RequestBody WorkScheduleRequestDto.Create request);

    @Operation(summary = "직원 주간 스케줄 일괄 등록",
            description = "사장님이 특정 직원의 주간 고정 근무 스케줄을 여러 건 한 번에 등록합니다. " +
                    "충돌 건은 건너뛰고 나머지를 저장하며, 충돌 목록을 함께 반환합니다.")
    ApiResponse<WorkScheduleResponseDto.BulkResult> addSchedules(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long employeeId,
            @Valid @RequestBody WorkScheduleRequestDto.CreateBulk request);

    @Operation(summary = "직원 주간 스케줄 조회",
            description = "사장님 또는 직원 본인이 특정 직원의 고정 근무 패턴을 조회합니다.")
    ApiResponse<List<WorkScheduleResponseDto.ScheduleInfo>> getSchedules(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long employeeId);

    @Operation(summary = "매장 전체 직원 스케줄 조회",
            description = "사장님이 특정 매장에 소속된 전체 직원의 주간 고정 스케줄을 조회합니다.")
    ApiResponse<List<WorkScheduleResponseDto.ScheduleInfo>> getStoreSchedules(
            @AuthUser Long userId,
            @PathVariable Long storeId
    );
    @Operation(summary = "매장 특정 요일 전체 직원 스케줄 조회",
            description = "사장님이 특정 매장의 특정 요일 근무 스케줄을 전체 직원 기준으로 조회합니다.")
    ApiResponse<List<WorkScheduleResponseDto.ScheduleInfo>> getStoreSchedulesByDay(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable DayOfWeek dayOfWeek
    );

    @Operation(summary = "직원 주간 스케줄 수정",
            description = "사장님이 특정 스케줄의 요일/시간/휴게시간을 수정합니다.")
    ApiResponse<WorkScheduleResponseDto.ScheduleInfo> updateSchedule(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long scheduleId,
            @Valid @RequestBody WorkScheduleRequestDto.Update request);

    @Operation(summary = "직원 주간 스케줄 삭제",
            description = "사장님이 특정 스케줄 1건을 삭제합니다.")
    ApiResponse<Void> deleteSchedule(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long scheduleId);
}
