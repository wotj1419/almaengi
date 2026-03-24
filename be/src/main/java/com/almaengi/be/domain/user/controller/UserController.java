package com.almaengi.be.domain.user.controller;

import com.almaengi.be.domain.finance.dto.FinanceResponseDto;
import com.almaengi.be.domain.user.dto.UserRequestDto;
import com.almaengi.be.domain.user.service.UserService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 사용자 관련 API를 제공합니다.
 * 금융망 계정 생성, 계좌 등록 등 사용자 본인의 금융 정보를 관리합니다.
 */
@Tag(name = "User [시연용]", description = "시연용 사용자 금융 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * SSAFY 금융망에 사용자 계정을 생성합니다.
     * JWT에서 추출한 userId로 사용자를 조회하여 이메일 기반으로 계정을 생성합니다.
     */
    @Operation(summary = "[시연용] 금융망 계정 생성", description = "SSAFY 금융망에 사용자 계정을 생성합니다.")
    @PostMapping("/me/finance-account")
    public ApiResponse<Void> createFinanceAccount(@AuthUser Long userId) {
        userService.createFinanceAccount(userId);
        return ApiResponse.success();
    }

    /**
     * SSAFY 금융망에 수시입출금 계좌를 생성합니다.
     * 은행코드를 받아 내부적으로 상품 조회 + 계좌 생성 API를 호출합니다.
     */
    @Operation(summary = "[시연용] 계좌 생성", description = "SSAFY 금융망에 수시입출금 계좌를 생성합니다.")
    @PostMapping("/me/account")
    public ApiResponse<Void> createAccount(
            @AuthUser Long userId,
            @Valid @RequestBody UserRequestDto.CreateAccount request) {
        userService.createAccount(userId, request.getBankCode());
        return ApiResponse.success();
    }

    /**
     * 사용자 계좌에서 출금합니다. (시연용)
     */
    @Operation(summary = "[시연용] 계좌 출금", description = "사용자 계좌에서 출금합니다.")
    @PostMapping("/me/withdraw")
    public ApiResponse<Void> withdraw(
            @AuthUser Long userId,
            @RequestParam Long amount,
            @RequestParam(defaultValue = "출금") String summary) {
        userService.withdraw(userId, amount, summary);
        return ApiResponse.success();
    }

    /**
     * 사용자 계좌에 입금합니다. (시연용)
     */
    @Operation(summary = "[시연용] 계좌 입금", description = "사용자 계좌에 입금합니다.")
    @PostMapping("/me/deposit")
    public ApiResponse<Void> deposit(
            @AuthUser Long userId,
            @RequestParam Long amount,
            @RequestParam(defaultValue = "입금") String summary) {
        userService.deposit(userId, amount, summary);
        return ApiResponse.success();
    }

    /**
     * 사용자 계좌의 잔액을 조회합니다. (시연용)
     */
    @Operation(summary = "[시연용] 잔액 조회", description = "사용자 계좌의 잔액을 조회합니다.")
    @GetMapping("/me/balance")
    public ApiResponse<Long> getBalance(@AuthUser Long userId) {
        return ApiResponse.success(userService.getBalance(userId));
    }

    /**
     * 사용자 계좌의 거래내역을 조회합니다.
     * startDate, endDate는 yyyyMMdd 형식으로 전달합니다.
     */
    @Operation(summary = "[시연용] 거래내역 조회", description = "사용자 계좌의 거래내역을 조회합니다.")
    @GetMapping("/me/transactions")
    public ApiResponse<List<FinanceResponseDto.TransactionHistory>> getTransactionHistory(
            @AuthUser Long userId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(defaultValue = "A") String transactionType,
            @RequestParam(defaultValue = "DESC") String orderByType) {
        List<FinanceResponseDto.TransactionHistory> history =
                userService.getTransactionHistory(userId, startDate, endDate, transactionType, orderByType);
        return ApiResponse.success(history);
    }
}
