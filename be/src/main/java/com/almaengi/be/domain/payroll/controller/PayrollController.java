package com.almaengi.be.domain.payroll.controller;

import com.almaengi.be.domain.payroll.controller.docs.PayrollControllerDocs;
import com.almaengi.be.domain.payroll.dto.PayrollRequestDto;
import com.almaengi.be.domain.payroll.dto.PayrollResponseDto;
import com.almaengi.be.domain.payroll.service.PayrollQueryService;
import com.almaengi.be.domain.payroll.service.PayrollService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/payrolls")
@RequiredArgsConstructor
public class PayrollController implements PayrollControllerDocs {

    private final PayrollQueryService payrollQueryService;
    private final PayrollService payrollService;

    @Override
    @GetMapping("/me")
    public ApiResponse<PayrollResponseDto.MyPayroll> getMyPayroll(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @RequestParam(required = false) String targetMonth) {

        LocalDate month = parseTargetMonthOrDefault(targetMonth);
        PayrollResponseDto.MyPayroll response = payrollQueryService.getMyPayroll(userId, storeId, month);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping
    public ApiResponse<PayrollResponseDto.StorePayrollSummary> getStorePayrolls(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @RequestParam String targetMonth) {

        LocalDate month = parseTargetMonth(targetMonth);
        PayrollResponseDto.StorePayrollSummary response = payrollQueryService.getStorePayrolls(userId, storeId, month);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/{payrollId}")
    public ApiResponse<PayrollResponseDto.PayrollDetailView> getPayrollDetail(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long payrollId) {

        PayrollResponseDto.PayrollDetailView response = payrollQueryService.getPayrollDetail(userId, storeId, payrollId);
        return ApiResponse.success(response);
    }

    @Override
    @PatchMapping("/{payrollId}/approve")
    public ApiResponse<Void> approvePayroll(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long payrollId) {

        payrollQueryService.approvePayroll(userId, storeId, payrollId);
        return ApiResponse.success();
    }

    @Override
    @PostMapping("/generate")
    public ApiResponse<PayrollResponseDto.GenerateResult> generatePayrolls(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @Valid @RequestBody PayrollRequestDto.Generate request) {

        LocalDate month = parseTargetMonth(request.getTargetMonth());
        PayrollService.StorePayrollResult result = payrollService.generateStorePayrolls(userId, storeId, month);
        PayrollResponseDto.GenerateResult response = PayrollResponseDto.GenerateResult.from(result);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/summary")
    public ApiResponse<PayrollResponseDto.MonthlySummary> getMonthlySummary(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @RequestParam String targetMonth) {

        LocalDate month = parseTargetMonth(targetMonth);
        PayrollResponseDto.MonthlySummary response = payrollQueryService.getMonthlySummary(userId, storeId, month);
        return ApiResponse.success(response);
    }

    // ─── Private Helpers ───

    /**
     * "yyyy-MM" 문자열을 LocalDate(1일)로 파싱합니다.
     */
    private LocalDate parseTargetMonth(String targetMonth) {
        try {
            return YearMonth.parse(targetMonth).atDay(1);
        } catch (DateTimeParseException e) {
            throw new BusinessException(ErrorCode.INVALID_TARGET_MONTH);
        }
    }

    /**
     * targetMonth가 null이면 현재 월을 반환합니다. (알바생 GET /me용)
     * 한국 시간대(Asia/Seoul) 기준으로 월 경계를 판단합니다.
     */
    private LocalDate parseTargetMonthOrDefault(String targetMonth) {
        if (targetMonth == null || targetMonth.isBlank()) {
            return YearMonth.now(ZoneId.of("Asia/Seoul")).atDay(1);
        }
        return parseTargetMonth(targetMonth);
    }
}
