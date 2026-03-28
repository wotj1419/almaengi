package com.almaengi.be.domain.document.controller.docs;

import com.almaengi.be.domain.document.dto.DocumentResponseDto;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "내 문서함 API", description = "개인 서류 업로드, 조회, 삭제 API")
public interface DocumentControllerDocs {

    @Operation(summary = "서류 업로드", description = "개인 문서함에 서류를 업로드합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "D002: 업로드할 파일이 비어있습니다."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다.")
    })
    ApiResponse<DocumentResponseDto.Info> upload(
            @Parameter(hidden = true) Long userId,
            @Parameter(description = "업로드할 파일") MultipartFile file,
            @Parameter(description = "문서 유형", example = "CONTRACT") String docType,
            @Parameter(description = "만료일 (선택)", example = "2026-12-31") String expireDate);

    @Operation(summary = "내 서류 목록 조회", description = "개인 문서함의 서류 목록을 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공")
    })
    ApiResponse<DocumentResponseDto.ListResponse> getMyDocuments(
            @Parameter(hidden = true) Long userId);

    @Operation(summary = "서류 상세 조회", description = "특정 서류의 상세 정보를 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "D001: 해당 문서를 찾을 수 없습니다.")
    })
    ApiResponse<DocumentResponseDto.Info> getDocument(
            @Parameter(hidden = true) Long userId,
            @Parameter(description = "문서 ID", example = "1") Long docId);

    @Operation(summary = "서류 삭제", description = "개인 문서함의 서류를 삭제합니다 (소프트 삭제).")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "D001: 해당 문서를 찾을 수 없습니다.")
    })
    ApiResponse<Void> deleteDocument(
            @Parameter(hidden = true) Long userId,
            @Parameter(description = "문서 ID", example = "1") Long docId);
}
