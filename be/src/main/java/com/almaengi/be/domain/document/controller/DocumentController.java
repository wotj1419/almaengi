package com.almaengi.be.domain.document.controller;

import com.almaengi.be.domain.document.controller.docs.DocumentControllerDocs;
import com.almaengi.be.domain.document.dto.DocumentResponseDto;
import com.almaengi.be.domain.document.service.DocumentService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController implements DocumentControllerDocs {

    private final DocumentService documentService;

    @Override
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<DocumentResponseDto.Info> upload(
            @AuthUser Long userId,
            @RequestPart("file") MultipartFile file,
            @RequestPart("docType") String docType,
            @RequestPart(value = "expireDate", required = false) String expireDate) {

        return ApiResponse.success(documentService.upload(userId, file, docType, expireDate));
    }

    @Override
    @GetMapping
    public ApiResponse<DocumentResponseDto.ListResponse> getMyDocuments(
            @AuthUser Long userId) {
        return ApiResponse.success(documentService.getMyDocuments(userId));
    }

    @Override
    @GetMapping("/{docId}")
    public ApiResponse<DocumentResponseDto.Info> getDocument(
            @AuthUser Long userId,
            @PathVariable("docId") Long docId) {
        return ApiResponse.success(documentService.getDocument(userId, docId));
    }

    @Override
    @DeleteMapping("/{docId}")
    public ApiResponse<Void> deleteDocument(
            @AuthUser Long userId,
            @PathVariable("docId") Long docId) {
        documentService.deleteDocument(userId, docId);
        return ApiResponse.success();
    }
}
