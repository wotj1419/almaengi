package com.almaengi.be.domain.store.controller;

import com.almaengi.be.domain.store.controller.docs.WorkScheduleControllerDocs;
import com.almaengi.be.domain.store.dto.WorkScheduleRequestDto;
import com.almaengi.be.domain.store.dto.WorkScheduleResponseDto;
import com.almaengi.be.domain.store.service.WorkScheduleService;
import com.almaengi.be.domain.store.type.DayOfWeek;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stores")
@RequiredArgsConstructor
public class WorkScheduleController implements WorkScheduleControllerDocs {

    private final WorkScheduleService workScheduleService;

    @Override
    @PostMapping("/{storeId}/employees/{employeeId}/schedules")
    public ApiResponse<WorkScheduleResponseDto.ScheduleInfo> addSchedule(@AuthUser Long userId, @PathVariable Long storeId, @PathVariable Long employeeId, @Valid @RequestBody WorkScheduleRequestDto.Create request) {
        WorkScheduleResponseDto.ScheduleInfo response = workScheduleService.addSchedule(userId, storeId, employeeId, request);
        return ApiResponse.success(response);
    }

    @Override
    @PostMapping("/{storeId}/employees/{employeeId}/schedules/bulk")
    public ApiResponse<WorkScheduleResponseDto.BulkResult> addSchedules(@AuthUser Long userId, @PathVariable Long storeId, @PathVariable Long employeeId, @Valid @RequestBody WorkScheduleRequestDto.CreateBulk request) {
        WorkScheduleResponseDto.BulkResult response = workScheduleService.addSchedules(userId, storeId, employeeId, request);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/{storeId}/employees/{employeeId}/schedules")
    public ApiResponse<List<WorkScheduleResponseDto.ScheduleInfo>> getSchedules(@AuthUser Long userId, @PathVariable Long storeId, @PathVariable Long employeeId) {
        List<WorkScheduleResponseDto.ScheduleInfo> response = workScheduleService.getSchedules(userId, storeId, employeeId);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/{storeId}/employees/schedules")
    public ApiResponse<List<WorkScheduleResponseDto.ScheduleInfo>> getStoreSchedules(@AuthUser Long userId, @PathVariable Long storeId) {
        List<WorkScheduleResponseDto.ScheduleInfo> response = workScheduleService.getStoreSchedules(userId, storeId);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/{storeId}/employees/schedules/me")
    public ApiResponse<List<WorkScheduleResponseDto.ScheduleInfo>> getMySchedules(
            @AuthUser Long userId,
            @PathVariable Long storeId) {
        List<WorkScheduleResponseDto.ScheduleInfo> response = workScheduleService.getMySchedules(userId, storeId);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/{storeId}/employees/schedules/{dayOfWeek}")
    public ApiResponse<List<WorkScheduleResponseDto.ScheduleInfo>> getStoreSchedulesByDay(@AuthUser Long userId, @PathVariable Long storeId, @PathVariable DayOfWeek dayOfWeek) {
        List<WorkScheduleResponseDto.ScheduleInfo> response = workScheduleService.getStoreSchedulesByDay(userId, storeId, dayOfWeek);
        return ApiResponse.success(response);
    }

    @Override
    @PatchMapping("/{storeId}/employees/{employeeId}/schedules/{scheduleId}")
    public ApiResponse<WorkScheduleResponseDto.ScheduleInfo> updateSchedule(@AuthUser Long userId, @PathVariable Long storeId, @PathVariable Long scheduleId, @Valid @RequestBody WorkScheduleRequestDto.Update request) {
        WorkScheduleResponseDto.ScheduleInfo response = workScheduleService.updateSchedule(userId, storeId, scheduleId, request);
        return ApiResponse.success(response);
    }

    @Override
    @DeleteMapping("/{storeId}/employees/{employeeId}/schedules/{scheduleId}")
    public ApiResponse<Void> deleteSchedule(@AuthUser Long userId, @PathVariable Long storeId, @PathVariable Long scheduleId) {
        workScheduleService.deleteSchedule(userId, storeId, scheduleId);
        return ApiResponse.success();
    }
}
