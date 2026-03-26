package com.almaengi.be.domain.finance.controller;

import com.almaengi.be.domain.finance.controller.docs.FinanceControllerDocs;
import com.almaengi.be.domain.finance.dto.FinanceResponseDto;
import com.almaengi.be.domain.finance.service.SsafyFinanceService;
import com.almaengi.be.domain.payroll.scheduler.PayrollGenerationScheduler;
import com.almaengi.be.domain.payroll.scheduler.PayrollTransferScheduler;
import com.almaengi.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 시연용 금융망 관련 API를 제공합니다.
 * 은행코드 조회, 급여 이체 스케줄러 트리거 등 시연/테스트 목적의 엔드포인트입니다.
 */
@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
public class FinanceController implements FinanceControllerDocs {

    private final SsafyFinanceService ssafyFinanceService;
    private final PayrollGenerationScheduler payrollGenerationScheduler;
    private final PayrollTransferScheduler payrollTransferScheduler;

    @Override
    @GetMapping("/banks")
    public ApiResponse<List<FinanceResponseDto.BankCode>> getBankCodes() {
        List<Map<String, String>> bankCodes = ssafyFinanceService.inquireBankCodes();

        List<FinanceResponseDto.BankCode> response = bankCodes.stream()
                .map(bank -> FinanceResponseDto.BankCode.builder()
                        .bankCode(bank.get("bankCode"))
                        .bankName(bank.get("bankName"))
                        .build())
                .toList();

        return ApiResponse.success(response);
    }

    @Override
    @PostMapping("/trigger-generation")
    public ApiResponse<Void> triggerGenerationForTest() {
        payrollGenerationScheduler.generateMonthlyPayrollsAndPayslips();
        return ApiResponse.success();
    }

    @Override
    @PostMapping("/trigger-transfer")
    public ApiResponse<Void> triggerTransferForTest() {
        payrollTransferScheduler.processPayrollTransfers();
        return ApiResponse.success();
    }
}
