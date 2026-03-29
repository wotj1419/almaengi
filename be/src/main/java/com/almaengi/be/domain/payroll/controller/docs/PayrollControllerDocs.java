package com.almaengi.be.domain.payroll.controller.docs;

import com.almaengi.be.domain.payroll.dto.PayrollRequestDto;
import com.almaengi.be.domain.payroll.dto.PayrollResponseDto;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "급여 관리 API", description = "급여 조회, 승인, 지출 요약, 이체, 문서 API")
public interface PayrollControllerDocs {

    @Operation(summary = "내 급여 조회 (알바생)", description = "이번 달 누적 근무 시간과 예상 급여를 실시간으로 확인합니다. 급여 미생성 시 실시간 추정값을 반환합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "S002: 해당 매장의 직원을 찾을 수 없습니다.")
    })
    ApiResponse<PayrollResponseDto.MyPayroll> getMyPayroll(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "조회 대상 월 (yyyy-MM, 미입력 시 현재 월)", example = "2026-03")
            @RequestParam(required = false) String targetMonth
    );

    @Operation(summary = "전 직원 급여 목록 조회 (사장님)", description = "월별 전 직원 급여를 한눈에 확인합니다. 총 근무·연장·야간 시간 합계와 직원별 시급·이체 상태를 포함합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "P005: 해당 매장의 급여를 관리할 권한이 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "P007: 잘못된 정산 월 형식입니다.")
    })
    ApiResponse<PayrollResponseDto.StorePayrollSummary> getStorePayrolls(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "조회 대상 월 (yyyy-MM)", example = "2026-03")
            @RequestParam String targetMonth
    );

    @Operation(summary = "급여 상세 조회", description = "특정 직원의 급여 상세 내역(기본급, 수당, 공제)을 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "P002: 해당 급여 정산 내역을 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "P006: 해당 급여를 조회할 권한이 없습니다.")
    })
    ApiResponse<PayrollResponseDto.PayrollDetailView> getPayrollDetail(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "급여 ID", example = "1") @PathVariable Long payrollId
    );

    @Operation(summary = "급여 승인", description = "사장님이 직원의 급여를 최종 승인합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "P005: 해당 매장의 급여를 관리할 권한이 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "P003: 이미 승인된 급여입니다.")
    })
    ApiResponse<Void> approvePayroll(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "급여 ID", example = "1") @PathVariable Long payrollId
    );

    @Operation(summary = "급여 일괄 생성", description = "매장 전체 활성 직원의 월 급여를 일괄 생성합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "P005: 해당 매장의 급여를 관리할 권한이 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "P007: 잘못된 정산 월 형식입니다.")
    })
    ApiResponse<PayrollResponseDto.GenerateResult> generatePayrolls(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @RequestBody PayrollRequestDto.Generate request
    );

    @Operation(summary = "급여 지출 요약 (전월 대비)", description = "총 급여·주휴수당·연장수당·야간수당의 전월 대비 비교, 직원별 netPay 리스트, 최고급여자를 반환합니다. 진행 중인 월이면 Attendance 기반 부분 기간 비교를 수행합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "P005: 해당 매장의 급여를 관리할 권한이 없습니다.")
    })
    ApiResponse<PayrollResponseDto.MonthlySummary> getMonthlySummary(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "조회 대상 월 (yyyy-MM)", example = "2026-03")
            @RequestParam String targetMonth
    );

    @Operation(summary = "급여 일괄 승인", description = "해당 월의 미승인 급여를 전체 승인합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공 (승인된 건수 반환)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "P005: 해당 매장의 급여를 관리할 권한이 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "P007: 잘못된 정산 월 형식입니다.")
    })
    ApiResponse<Integer> approveAllPayrolls(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "대상 월 (yyyy-MM)", example = "2026-03")
            @RequestParam String targetMonth
    );

    @Operation(summary = "수동 급여 이체", description = "자동 이체 실패 시 사장님이 직접 이체를 실행합니다. 승인된 미이체 급여만 이체됩니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "이체 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "P005: 해당 매장의 급여를 관리할 권한이 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "P007: 잘못된 정산 월 형식입니다.<br>T001: 잔액이 부족합니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "S001: 해당 매장을 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "T002: 급여 이체에 실패했습니다.")
    })
    ApiResponse<Void> transferPayrolls(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "대상 월 (yyyy-MM)", example = "2026-03")
            @RequestParam String targetMonth
    );

    @Operation(summary = "급여명세서 PDF 미리보기/다운로드", description = "특정 급여의 명세서 PDF를 조회합니다. 기본은 미리보기(inline), download=true 시 다운로드(attachment). 매장 사장님 또는 해당 알바생 본인만 가능합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "PDF 파일 반환"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "P002: 해당 급여 정산 내역을 찾을 수 없습니다.<br>PS001: 급여명세서 파일이 존재하지 않습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "P006: 해당 급여를 조회할 권한이 없습니다.")
    })
    ResponseEntity<byte[]> downloadPayslip(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "급여 ID", example = "1") @PathVariable Long payrollId,
            @Parameter(description = "true: 다운로드, false: 미리보기 (기본값)", example = "false")
            @RequestParam(defaultValue = "false") boolean download
    );
}
