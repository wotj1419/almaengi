package com.almaengi.be.domain.attendance.controller;

import com.almaengi.be.domain.attendance.dto.AttendanceLogResponseDto;
import com.almaengi.be.domain.attendance.dto.AttendanceRequestDto;
import com.almaengi.be.domain.attendance.dto.AttendanceResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardDetailResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardSummaryResponseDto;
import com.almaengi.be.domain.attendance.service.AttendanceService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * 출퇴근 API 컨트롤러입니다.
 *
 * - POST /api/v1/attendances : GPS+QR 출퇴근 기록
 * - userId는 JWT 인증을 통해 @AuthUser로 주입됩니다.
 */
@Tag(name = "출퇴근 API", description = "GPS+QR 출퇴근 기록, 실시간 대시보드, 날짜별 기록 조회")
@RestController
@RequestMapping("/api/v1/attendances")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @Operation(summary = "GPS+QR 출퇴근 기록", description = "QR 토큰과 GPS 좌표를 검증하여 출근 또는 퇴근을 자동 분기 처리합니다.")
    @PostMapping
    public ResponseEntity<ApiResponse<AttendanceResponseDto>> recordAttendance(
            @AuthUser Long userId,
            @Valid @RequestBody AttendanceRequestDto request) {
        AttendanceResponseDto response = attendanceService.recordAttendance(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ===== 대시보드 API =====

    /** 매장 대시보드 요약: 근무중/지각/결근 직원 수 조회 (Redis만 사용) */
    @Operation(summary = "대시보드 요약", description = "매장의 근무중/지각/결근 직원 수를 Redis에서 조회합니다.")
    @GetMapping("/dashboard/{storeId}")
    public ResponseEntity<ApiResponse<DashboardSummaryResponseDto>> getDashboardSummary(
            @PathVariable Long storeId) {
        DashboardSummaryResponseDto response = attendanceService.getDashboardSummary(storeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /** 상태별 직원 목록 조회: 특정 상태 클릭 시 직원 정보 반환 (Redis + DB) */
    @Operation(summary = "상태별 직원 목록", description = "특정 상태(working/late/absent)의 직원 목록을 조회합니다.")
    @GetMapping("/dashboard/{storeId}/{status}")
    public ResponseEntity<ApiResponse<DashboardDetailResponseDto>> getDashboardDetail(
            @PathVariable Long storeId, @PathVariable String status) {
        DashboardDetailResponseDto response = attendanceService.getDashboardDetail(storeId, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ===== 근태 로그 API =====

    /** 근태 로그 조회: 특정 매장의 특정 날짜 근태 기록 반환 (당일 조회 불가) */
    @Operation(summary = "근태 로그 조회", description = "특정 매장의 특정 날짜 근태 기록을 조회합니다. 당일은 조회 불가합니다. (yyyy-MM-dd)")
    @GetMapping("/log/{storeId}")
    public ResponseEntity<ApiResponse<AttendanceLogResponseDto>> getAttendanceLog(
            @PathVariable Long storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        AttendanceLogResponseDto response = attendanceService.getAttendanceLog(storeId, date);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

}
