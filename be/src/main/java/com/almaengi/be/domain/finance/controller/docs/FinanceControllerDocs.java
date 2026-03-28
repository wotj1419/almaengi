package com.almaengi.be.domain.finance.controller.docs;

import com.almaengi.be.domain.finance.dto.FinanceResponseDto;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@Tag(name = "[시연용] Finance", description = "시연용 금융망 API")
public interface FinanceControllerDocs {

    @Operation(summary = "[시연용] 은행코드 목록 조회", description = "SSAFY 금융망에서 지원하는 은행코드 목록을 조회합니다. 계좌 생성 시 bankCode 선택에 사용됩니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "F001: 금융망 API 호출에 실패했습니다.")
    })
    ApiResponse<List<FinanceResponseDto.BankCode>> getBankCodes();

    @Operation(summary = "[시연용] 급여 정산 + 명세서 생성 트리거", description = "급여 자동 정산 스케줄러를 수동으로 실행합니다. 전 매장의 전월분 급여를 정산하고 급여명세서 PDF를 생성합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공")
    })
    ApiResponse<Void> triggerGenerationForTest();

    @Operation(summary = "[시연용] 급여 이체 스케줄러 트리거", description = "급여 자동 이체 스케줄러를 수동으로 실행합니다. 오늘이 급여일인 매장의 승인된 급여를 이체합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "F001: 금융망 API 호출에 실패했습니다.")
    })
    ApiResponse<Void> triggerTransferForTest();
}
