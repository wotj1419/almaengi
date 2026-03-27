package com.almaengi.be.domain.attendance.controller;

import com.almaengi.be.domain.attendance.controller.docs.AttendanceControllerDocs;
import com.almaengi.be.domain.attendance.dto.AttendanceLogResponseDto;
import com.almaengi.be.domain.attendance.dto.AttendanceRequestDto;
import com.almaengi.be.domain.attendance.dto.AttendanceResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardDetailResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardSummaryResponseDto;
import com.almaengi.be.domain.attendance.service.AttendanceService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * 출퇴근 API 컨트롤러입니다.
 *
 * - POST /api/v1/attendances : GPS+QR 출퇴근 기록
 * - userId는 JWT 인증을 통해 @AuthUser로 주입됩니다.
 */
@RestController
@RequestMapping("/api/v1/attendances")
@RequiredArgsConstructor
public class AttendanceController implements AttendanceControllerDocs {

    private final AttendanceService attendanceService;

    @Override
    @PostMapping
    public ApiResponse<AttendanceResponseDto> recordAttendance(
            @AuthUser Long userId,
            @Valid @RequestBody AttendanceRequestDto request) {
        AttendanceResponseDto response = attendanceService.recordAttendance(userId, request);
        return ApiResponse.success(response);
    }

    // ===== 대시보드 API =====

    @Override
    @GetMapping("/dashboard/{storeId}")
    public ApiResponse<DashboardSummaryResponseDto> getDashboardSummary(
            @AuthUser Long userId,
            @PathVariable Long storeId) {
        DashboardSummaryResponseDto response = attendanceService.getDashboardSummary(userId, storeId);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/dashboard/{storeId}/{status}")
    public ApiResponse<DashboardDetailResponseDto> getDashboardDetail(
            @AuthUser Long userId,
            @PathVariable Long storeId, @PathVariable String status) {
        DashboardDetailResponseDto response = attendanceService.getDashboardDetail(userId, storeId, status);
        return ApiResponse.success(response);
    }

    // ===== 근태 로그 API =====

    @Override
    @GetMapping("/log/{storeId}")
    public ApiResponse<AttendanceLogResponseDto> getAttendanceLog(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        AttendanceLogResponseDto response = attendanceService.getAttendanceLog(userId, storeId, date);
        return ApiResponse.success(response);
    }

}
