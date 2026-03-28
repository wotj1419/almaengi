package com.almaengi.be.domain.document.controller.docs;

import com.almaengi.be.domain.document.dto.EmployeeDocumentRequestDto;
import com.almaengi.be.domain.document.dto.EmployeeDocumentResponseDto;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "매장 제출 문서 API", description = "매장에 서류 제출, 조회, 승인/반려, 제출 요청 API")
public interface EmployeeDocumentControllerDocs {

    @Operation(summary = "기존 문서로 제출", description = "내 문서함의 기존 문서를 매장에 제출합니다. 파일이 매장 디렉토리로 복사됩니다. 삭제/만료된 문서는 제출할 수 없습니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "D008: 유효하지 않은 상태의 문서입니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "D001: 해당 문서를 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "U004: 접근 권한이 없는 유저입니다.")
    })
    ApiResponse<EmployeeDocumentResponseDto.Info> submitFromMyDoc(
            @Parameter(hidden = true) Long userId,
            @Parameter(description = "매장 ID", example = "1") Long storeId,
            @Parameter(description = "직원 ID", example = "1") Long employeeId,
            EmployeeDocumentRequestDto.Submit request);

    @Operation(summary = "직접 파일 업로드 제출", description = "내 문서함을 거치지 않고 매장에 직접 파일을 업로드하여 제출합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "D002: 업로드할 파일이 비어있습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "U004: 접근 권한이 없는 유저입니다.")
    })
    ApiResponse<EmployeeDocumentResponseDto.Info> uploadAndSubmit(
            @Parameter(hidden = true) Long userId,
            @Parameter(description = "매장 ID", example = "1") Long storeId,
            @Parameter(description = "직원 ID", example = "1") Long employeeId,
            @Parameter(description = "업로드할 파일") MultipartFile file,
            @Parameter(description = "문서 유형", example = "CONTRACT") String docType,
            @Parameter(description = "만료일 (선택)", example = "2026-12-31") String expireDate);

    @Operation(summary = "제출 서류 목록 조회", description = "매장에 제출된 서류 목록을 조회합니다. 사장님 또는 해당 알바생만 조회 가능합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "U004: 접근 권한이 없는 유저입니다.")
    })
    ApiResponse<EmployeeDocumentResponseDto.ListResponse> getDocuments(
            @Parameter(hidden = true) Long userId,
            @Parameter(description = "매장 ID", example = "1") Long storeId,
            @Parameter(description = "직원 ID", example = "1") Long employeeId);

    @Operation(summary = "제출 서류 상태 변경", description = "제출된 서류의 상태를 변경합니다 (승인/반려). 사장님만 가능합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "D001: 해당 문서를 찾을 수 없습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "U004: 접근 권한이 없는 유저입니다.")
    })
    ApiResponse<EmployeeDocumentResponseDto.Info> updateStatus(
            @Parameter(hidden = true) Long userId,
            @Parameter(description = "매장 ID", example = "1") Long storeId,
            @Parameter(description = "직원 ID", example = "1") Long employeeId,
            @Parameter(description = "문서 ID", example = "1") Long docId,
            EmployeeDocumentRequestDto.StatusUpdate request);

    @Operation(summary = "서류 제출 요청", description = "사장님이 알바생에게 서류 제출을 요청합니다. 알림이 발송됩니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "U004: 접근 권한이 없는 유저입니다.")
    })
    ApiResponse<Void> requestDocument(
            @Parameter(hidden = true) Long userId,
            @Parameter(description = "매장 ID", example = "1") Long storeId,
            @Parameter(description = "직원 ID", example = "1") Long employeeId,
            EmployeeDocumentRequestDto.Request request);
}
