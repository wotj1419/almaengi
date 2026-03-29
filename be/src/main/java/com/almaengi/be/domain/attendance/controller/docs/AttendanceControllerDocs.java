package com.almaengi.be.domain.attendance.controller.docs;

import com.almaengi.be.domain.attendance.dto.AttendanceLogResponseDto;
import com.almaengi.be.domain.attendance.dto.AttendanceRequestDto;
import com.almaengi.be.domain.attendance.dto.AttendanceResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardDetailResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardSummaryResponseDto;
import com.almaengi.be.domain.attendance.dto.MonthlyAttendanceReportResponseDto;
import com.almaengi.be.domain.attendance.dto.MyAttendanceLogResponseDto;
import com.almaengi.be.domain.attendance.dto.MyAttendanceResponseDto;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
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
    ApiResponse<AttendanceResponseDto> recordAttendance(
            @Parameter(hidden = true) @AuthUser Long userId,
            @RequestBody AttendanceRequestDto request
    );

    @Operation(summary = "알바생 본인 오늘 출퇴근 현황", description = "Redis에서 현재 상태(working/late/absent)를, DB에서 예정 퇴근 시각을 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "S002: 해당 매장의 직원을 찾을 수 없습니다.")
    })
    ApiResponse<MyAttendanceResponseDto> getMyTodayAttendance(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @RequestParam Long storeId
    );

    @Operation(summary = "알바생 본인 일별 근태 상세", description = "본인의 특정 날짜 근태 상세를 조회합니다. 기록이 없으면 exists=false를 반환합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "S002: 해당 매장의 직원을 찾을 수 없습니다.")
    })
    ApiResponse<MyAttendanceLogResponseDto> getMyAttendanceLog(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @RequestParam Long storeId,
            @Parameter(description = "조회 날짜 (yyyy-MM-dd)", example = "2026-03-23")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    );

    @Operation(summary = "대시보드 요약", description = "매장의 근무중/지각/결근 직원 수를 Redis에서 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "A206: 해당 매장의 근태를 조회할 권한이 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "S001: 해당 매장을 찾을 수 없습니다.")
    })
    ApiResponse<DashboardSummaryResponseDto> getDashboardSummary(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId
    );

    @Operation(summary = "상태별 직원 목록", description = "특정 상태(working/late/absent)의 직원 목록을 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "A204: 유효하지 않은 대시보드 상태입니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "A206: 해당 매장의 근태를 조회할 권한이 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "S001: 해당 매장을 찾을 수 없습니다.")
    })
    ApiResponse<DashboardDetailResponseDto> getDashboardDetail(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "상태 (working/late/absent)", example = "working") @PathVariable String status
    );

    @Operation(summary = "일별 근태 로그 조회", description = "특정 매장의 특정 날짜 근태 기록을 조회합니다. 당일은 조회 불가합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "A205: 근태 로그는 전일까지만 조회할 수 있습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "A206: 해당 매장의 근태를 조회할 권한이 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "S001: 해당 매장을 찾을 수 없습니다.")
    })
    ApiResponse<AttendanceLogResponseDto> getAttendanceLog(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "조회 날짜 (yyyy-MM-dd)", example = "2026-03-23")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    );

    @Operation(summary = "월별 근태 리포트", description = "매장의 월별 직원 근태 현황을 집계합니다. 출근수/지각수/결근수/근무시간과 성실왕/지각왕을 반환합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "P007: 잘못된 정산 월 형식입니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "A206: 해당 매장의 근태를 조회할 권한이 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "S001: 해당 매장을 찾을 수 없습니다.")
    })
    ApiResponse<MonthlyAttendanceReportResponseDto> getMonthlyReport(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "조회 대상 월 (yyyy-MM)", example = "2026-03") @RequestParam String targetMonth
    );
}
