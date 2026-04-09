package com.almaengi.be.domain.document.controller;

import com.almaengi.be.domain.document.controller.docs.EmployeeDocumentControllerDocs;
import com.almaengi.be.domain.document.dto.EmployeeDocumentRequestDto;
import com.almaengi.be.domain.document.dto.EmployeeDocumentResponseDto;
import com.almaengi.be.domain.document.service.EmployeeDocumentService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/employees/{employeeId}/documents")
@RequiredArgsConstructor
public class EmployeeDocumentController implements EmployeeDocumentControllerDocs {

    private final EmployeeDocumentService employeeDocumentService;

    @Override
    @PostMapping("/submit")
    public ApiResponse<EmployeeDocumentResponseDto.Info> submitFromMyDoc(
            @AuthUser Long userId,
            @PathVariable("storeId") Long storeId,
            @PathVariable("employeeId") Long employeeId,
            @Valid @RequestBody EmployeeDocumentRequestDto.Submit request) {
        return ApiResponse.success(
                employeeDocumentService.submitFromMyDoc(userId, storeId, employeeId, request.getDocumentId()));
    }

    @Override
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<EmployeeDocumentResponseDto.Info> uploadAndSubmit(
            @AuthUser Long userId,
            @PathVariable("storeId") Long storeId,
            @PathVariable("employeeId") Long employeeId,
            @RequestPart("file") MultipartFile file,
            @RequestPart("docType") String docType,
            @RequestPart(value = "expireDate", required = false) String expireDate) {

        return ApiResponse.success(
                employeeDocumentService.uploadAndSubmit(userId, storeId, employeeId, file, docType, expireDate));
    }

    @Override
    @GetMapping
    public ApiResponse<EmployeeDocumentResponseDto.ListResponse> getDocuments(
            @AuthUser Long userId,
            @PathVariable("storeId") Long storeId,
            @PathVariable("employeeId") Long employeeId) {
        return ApiResponse.success(
                employeeDocumentService.getDocuments(userId, storeId, employeeId));
    }

    @Override
    @PatchMapping("/{docId}/status")
    public ApiResponse<EmployeeDocumentResponseDto.Info> updateStatus(
            @AuthUser Long userId,
            @PathVariable("storeId") Long storeId,
            @PathVariable("employeeId") Long employeeId,
            @PathVariable("docId") Long docId,
            @Valid @RequestBody EmployeeDocumentRequestDto.StatusUpdate request) {
        return ApiResponse.success(
                employeeDocumentService.updateStatus(userId, storeId, employeeId, docId, request.getStatus()));
    }

    @Override
    @PostMapping("/request")
    public ApiResponse<Void> requestDocument(
            @AuthUser Long userId,
            @PathVariable("storeId") Long storeId,
            @PathVariable("employeeId") Long employeeId,
            @Valid @RequestBody EmployeeDocumentRequestDto.Request request) {
        employeeDocumentService.requestDocument(userId, storeId, employeeId, request.getDocType());
        return ApiResponse.success();
    }
}
