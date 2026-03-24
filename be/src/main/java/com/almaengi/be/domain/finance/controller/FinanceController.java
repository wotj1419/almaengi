package com.almaengi.be.domain.finance.controller;

import com.almaengi.be.domain.finance.dto.FinanceResponseDto;
import com.almaengi.be.domain.finance.service.SsafyFinanceService;
import com.almaengi.be.domain.payroll.scheduler.PayrollTransferScheduler;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 시연용 금융망 관련 API를 제공합니다.
 * 은행코드 조회, 급여 이체 스케줄러 트리거 등 시연/테스트 목적의 엔드포인트입니다.
 */
@Tag(name = "Finance [시연용]", description = "시연용 금융망 API")
@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final SsafyFinanceService ssafyFinanceService;
    private final PayrollTransferScheduler payrollTransferScheduler;

    /**
     * SSAFY 금융망에서 지원하는 은행코드 목록을 조회합니다.
     * 프론트엔드 은행 선택 화면에서 사용됩니다.
     */
    @Operation(summary = "[시연용] 은행코드 목록 조회", description = "SSAFY 금융망에서 지원하는 은행코드 목록을 조회합니다.")
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

    /**
     * [시연용] 급여 자동 이체 스케줄러를 수동으로 트리거합니다.
     * 스케줄러와 동일한 로직으로 오늘이 급여일인 매장의 승인된 급여를 이체합니다.
     */
    @Operation(summary = "[시연용] 급여 이체 스케줄러 트리거", description = "급여 자동 이체 스케줄러를 수동으로 실행합니다.")
    @PostMapping("/trigger-transfer")
    public ApiResponse<Void> triggerTransferForTest() {
        payrollTransferScheduler.processPayrollTransfers();
        return ApiResponse.success();
    }
}
