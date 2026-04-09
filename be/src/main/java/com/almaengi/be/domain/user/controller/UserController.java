package com.almaengi.be.domain.user.controller;

import com.almaengi.be.domain.finance.dto.FinanceResponseDto;
import com.almaengi.be.domain.user.controller.docs.UserControllerDocs;
import com.almaengi.be.domain.user.dto.UserRequestDto;
import com.almaengi.be.domain.user.service.UserService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 사용자 관련 API를 제공합니다.
 * 금융망 계정 생성, 계좌 등록 등 사용자 본인의 금융 정보를 관리합니다.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController implements UserControllerDocs {

    private final UserService userService;

    @Override
    @PostMapping("/me/finance-account")
    public ApiResponse<Void> createFinanceAccount(@AuthUser Long userId) {
        userService.createFinanceAccount(userId);
        return ApiResponse.success();
    }

    @Override
    @PostMapping("/me/account")
    public ApiResponse<Void> createAccount(
            @AuthUser Long userId,
            @Valid @RequestBody UserRequestDto.CreateAccount request) {
        userService.createAccount(userId, request.getBankCode());
        return ApiResponse.success();
    }

    @Override
    @PostMapping("/me/withdraw")
    public ApiResponse<Void> withdraw(
            @AuthUser Long userId,
            @RequestParam Long amount,
            @RequestParam(defaultValue = "출금") String summary) {
        userService.withdraw(userId, amount, summary);
        return ApiResponse.success();
    }

    @Override
    @PostMapping("/me/deposit")
    public ApiResponse<Void> deposit(
            @AuthUser Long userId,
            @RequestParam Long amount,
            @RequestParam(defaultValue = "입금") String summary) {
        userService.deposit(userId, amount, summary);
        return ApiResponse.success();
    }

    @Override
    @GetMapping("/me/balance")
    public ApiResponse<Long> getBalance(@AuthUser Long userId) {
        return ApiResponse.success(userService.getBalance(userId));
    }

    @Override
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
