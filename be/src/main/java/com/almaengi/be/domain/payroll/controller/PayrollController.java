package com.almaengi.be.domain.payroll.controller;

import com.almaengi.be.domain.payroll.controller.docs.PayrollControllerDocs;
import com.almaengi.be.domain.payroll.dto.PayrollRequestDto;
import com.almaengi.be.domain.payroll.dto.PayrollResponseDto;
import com.almaengi.be.domain.payroll.scheduler.PayrollGenerationScheduler;
import com.almaengi.be.domain.payroll.service.PayrollQueryService;
import com.almaengi.be.domain.payroll.service.PayrollService;
import com.almaengi.be.domain.payroll.service.PayrollTransferService;
import com.almaengi.be.domain.payroll.service.PayslipService;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.repository.StoreRepository;

import com.almaengi.be.global.annotation.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import com.almaengi.be.global.common.ApiResponse;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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
    private final PayrollTransferService payrollTransferService;
    private final PayslipService payslipService;
    private final StoreRepository storeRepository;

    private final PayrollGenerationScheduler payrollGenerationScheduler;

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
    @PatchMapping("/approve-all")
    public ApiResponse<Integer> approveAllPayrolls(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @RequestParam String targetMonth) {

        LocalDate month = parseTargetMonth(targetMonth);
        int approvedCount = payrollQueryService.approveAllPayrolls(userId, storeId, month);
        return ApiResponse.success(approvedCount);
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

    @Override
    @PostMapping("/transfer")
    public ApiResponse<Void> transferPayrolls(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @RequestParam String targetMonth) {

        LocalDate month = parseTargetMonth(targetMonth);
        // owner를 JOIN FETCH하여 이체 시 owner.getEmail() 접근 시 LazyInitializationException 방지
        Store store = storeRepository.findByIdWithOwner(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if (!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.PAYROLL_STORE_NOT_OWNED);
        }

        payrollTransferService.transferStorePayroll(store, month);
        return ApiResponse.success();
    }

    @Operation(summary = "급여명세서 PDF 수동 생성", description = "스케줄러(매월 1일 04:00)와 동일한 급여 정산 + PDF 생성을 즉시 실행합니다.")
    @PostMapping("/payslips/generate")
    public ApiResponse<Void> generatePayslips(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @RequestParam String targetMonth) {

        LocalDate month = parseTargetMonth(targetMonth);
//        payrollService.generateStorePayrolls(userId, storeId, month);
//        payslipService.generateStorePayslips(storeId, month);

        payrollGenerationScheduler.generateMonthlyPayrollsAndPayslipsDummy(storeId, month);

        return ApiResponse.success();
    }

    @Override
    @GetMapping("/{payrollId}/payslip")
    public ResponseEntity<byte[]> downloadPayslip(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long payrollId,
            @RequestParam(defaultValue = "false") boolean download) {

        byte[] pdfBytes = payslipService.getPayslipPdf(userId, payrollId);
        String fileName = payslipService.getPayslipFileName(payrollId);
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                .replace("+", "%20");

        String disposition = download
                ? "attachment; filename*=UTF-8''" + encodedFileName
                : "inline; filename*=UTF-8''" + encodedFileName;

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .body(pdfBytes);
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
