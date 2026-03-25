package com.almaengi.be.domain.contract.controller.docs;

import com.almaengi.be.domain.contract.dto.ContractRequestDto;
import com.almaengi.be.domain.contract.dto.ContractResponseDto;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Tag(name = "전자 근로계약서 API", description = "근로계약서 생성, 서명, 조회, PDF 다운로드 API")
public interface ContractControllerDocs {

    @Operation(summary = "계약서 생성", description = "사장님이 특정 직원에 대한 근로계약서를 생성합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "C007: 비활성 직원 / C009: 근무시간 오류 / C010: 계약기간 오류"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "S001: 매장 없음 / S002: 직원 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "C004: 매장 관리 권한 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "C008: 계약 기간 중복")
    })
    ApiResponse<ContractResponseDto.ContractDetail> createContract(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "직원 ID", example = "1") @PathVariable Long employeeId,
            @RequestBody ContractRequestDto.Create request
    );

    @Operation(summary = "매장 계약서 목록 조회", description = "사장님이 매장의 전체 근로계약서 목록을 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "C004: 매장 관리 권한 없음")
    })
    ApiResponse<List<ContractResponseDto.ContractSummary>> getStoreContracts(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId
    );

    @Operation(summary = "계약서 상세 조회", description = "근로계약서 상세 내용을 조회합니다. (사장님 또는 해당 알바생)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "C001: 계약서 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "C003: 접근 권한 없음")
    })
    ApiResponse<ContractResponseDto.ContractDetail> getContract(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "계약서 ID", example = "1") @PathVariable Long contractId
    );

    @Operation(summary = "사장님 서명", description = "사장님이 근로계약서에 서명합니다. 서명 후 PDF가 생성됩니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "C002: 현재 상태에서 서명 불가"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "C004: 매장 관리 권한 없음")
    })
    ApiResponse<ContractResponseDto.ContractDetail> signByOwner(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "계약서 ID", example = "1") @PathVariable Long contractId,
            @RequestBody ContractRequestDto.Sign request
    );

    @Operation(summary = "알바생 서명", description = "알바생이 근로계약서에 서명합니다. 양쪽 서명 완료 시 최종 PDF가 생성됩니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "C002: 현재 상태에서 서명 불가"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "C003: 접근 권한 없음")
    })
    ApiResponse<ContractResponseDto.ContractDetail> signByEmployee(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "계약서 ID", example = "1") @PathVariable Long contractId,
            @RequestBody ContractRequestDto.Sign request
    );

    @Operation(summary = "계약서 PDF 다운로드", description = "생성된 근로계약서 PDF를 다운로드합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "C006: PDF 파일 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "C003: 접근 권한 없음")
    })
    ResponseEntity<?> downloadContractPdf(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId,
            @Parameter(description = "계약서 ID", example = "1") @PathVariable Long contractId
    );

    @Operation(summary = "내 계약서 목록 조회 (알바생)", description = "알바생이 본인의 전체 근로계약서 목록을 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공")
    })
    ApiResponse<List<ContractResponseDto.ContractSummary>> getMyContracts(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable Long storeId
    );
}
