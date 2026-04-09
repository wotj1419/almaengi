package com.almaengi.be.domain.user.controller.docs;

import com.almaengi.be.domain.finance.dto.FinanceResponseDto;
import com.almaengi.be.domain.user.dto.UserRequestDto;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Tag(name = "[시연용] User", description = "시연용 사용자 금융 API")
public interface UserControllerDocs {

    @Operation(summary = "[시연용] 금융망 계정 생성", description = "SSAFY 금융망에 사용자 계정을 생성합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "F001: 금융망 API 호출에 실패했습니다.")
    })
    ApiResponse<Void> createFinanceAccount(
            @Parameter(hidden = true) @AuthUser Long userId
    );

    @Operation(summary = "[시연용] 계좌 생성", description = "SSAFY 금융망에 수시입출금 계좌를 생성합니다. 은행코드는 GET /api/v1/finance/banks 에서 조회할 수 있습니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "F003: 금융망 계정이 생성되지 않았습니다.<br>F004: 해당 은행코드의 수시입출금 상품을 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "F001: 금융망 API 호출에 실패했습니다.")
    })
    ApiResponse<Void> createAccount(
            @Parameter(hidden = true) @AuthUser Long userId,
            @RequestBody UserRequestDto.CreateAccount request
    );

    @Operation(summary = "[시연용] 계좌 출금", description = "사용자 계좌에서 출금합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "F003: 금융망 계정이 생성되지 않았습니다.<br>F005: 계좌가 등록되지 않았습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "F001: 금융망 API 호출에 실패했습니다.")
    })
    ApiResponse<Void> withdraw(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "출금 금액 (원)", example = "100000") @RequestParam Long amount,
            @Parameter(description = "거래 메모", example = "출금") @RequestParam(defaultValue = "출금") String summary
    );

    @Operation(summary = "[시연용] 계좌 입금", description = "사용자 계좌에 입금합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "F003: 금융망 계정이 생성되지 않았습니다.<br>F005: 계좌가 등록되지 않았습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "F001: 금융망 API 호출에 실패했습니다.")
    })
    ApiResponse<Void> deposit(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "입금 금액 (원)", example = "10000000") @RequestParam Long amount,
            @Parameter(description = "거래 메모", example = "입금") @RequestParam(defaultValue = "입금") String summary
    );

    @Operation(summary = "[시연용] 잔액 조회", description = "사용자 계좌의 잔액을 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공 (잔액 Long 반환)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "F003: 금융망 계정이 생성되지 않았습니다.<br>F005: 계좌가 등록되지 않았습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "F001: 금융망 API 호출에 실패했습니다.")
    })
    ApiResponse<Long> getBalance(
            @Parameter(hidden = true) @AuthUser Long userId
    );

    @Operation(summary = "[시연용] 거래내역 조회", description = "사용자 계좌의 거래내역을 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "F003: 금융망 계정이 생성되지 않았습니다.<br>F005: 계좌가 등록되지 않았습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "F001: 금융망 API 호출에 실패했습니다.")
    })
    ApiResponse<List<FinanceResponseDto.TransactionHistory>> getTransactionHistory(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "조회 시작일 (yyyyMMdd)", example = "20260301") @RequestParam String startDate,
            @Parameter(description = "조회 종료일 (yyyyMMdd)", example = "20260331") @RequestParam String endDate,
            @Parameter(description = "거래구분 (M:입금, D:출금, A:전체)", example = "A") @RequestParam(defaultValue = "A") String transactionType,
            @Parameter(description = "정렬순서 (ASC:오름차순, DESC:내림차순)", example = "DESC") @RequestParam(defaultValue = "DESC") String orderByType
    );
}
