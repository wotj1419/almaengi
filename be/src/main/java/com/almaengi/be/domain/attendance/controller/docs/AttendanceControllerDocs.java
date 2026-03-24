package com.almaengi.be.domain.attendance.controller.docs;

import com.almaengi.be.domain.attendance.dto.AttendanceLogResponseDto;
import com.almaengi.be.domain.attendance.dto.AttendanceRequestDto;
import com.almaengi.be.domain.attendance.dto.AttendanceResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardDetailResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardSummaryResponseDto;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

@Tag(name = "출퇴근 API", description = "GPS+QR 출퇴근 기록, 실시간 대시보드, 날짜별 기록 조회")
public interface AttendanceControllerDocs {

    @Operation(summary = "GPS+QR 출퇴근 기록", description = "QR 토큰과 GPS 좌표를 검증하여 출근 또는 퇴근을 자동 분기 처리합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "출근/퇴근 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "A201: 유효하지 않은 QR 코드입니다.<br>A202: 매장 반경을 벗어난 위치입니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "A203: 이미 퇴근 처리가 완료되었습니다.")
    })
    ResponseEntity<ApiResponse<AttendanceResponseDto>> recordAttendance(
            @Parameter(hidden = true) @AuthUser Long userId,
            @RequestBody AttendanceRequestDto request
    );

    @Operation(summary = "대시보드 요약", description = "매장의 근무중/지각/결근 직원 수를 Redis에서 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공")
    })
    ResponseEntity<ApiResponse<DashboardSummaryResponseDto>> getDashboardSummary(
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId
    );

    @Operation(summary = "상태별 직원 목록", description = "특정 상태(working/late/absent)의 직원 목록을 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "A204: 유효하지 않은 대시보드 상태입니다.")
    })
    ResponseEntity<ApiResponse<DashboardDetailResponseDto>> getDashboardDetail(
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "상태 (working/late/absent)", example = "working") @PathVariable String status
    );

    @Operation(summary = "근태 로그 조회", description = "특정 매장의 특정 날짜 근태 기록을 조회합니다. 당일은 조회 불가합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "A205: 근태 로그는 전일까지만 조회할 수 있습니다.")
    })
    ResponseEntity<ApiResponse<AttendanceLogResponseDto>> getAttendanceLog(
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "조회 날짜 (yyyy-MM-dd)", example = "2026-03-23")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    );
}
