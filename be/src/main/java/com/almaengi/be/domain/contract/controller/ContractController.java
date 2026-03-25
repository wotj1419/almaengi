package com.almaengi.be.domain.contract.controller;

import com.almaengi.be.domain.contract.controller.docs.ContractControllerDocs;
import com.almaengi.be.domain.contract.dto.ContractRequestDto;
import com.almaengi.be.domain.contract.dto.ContractResponseDto;
import com.almaengi.be.domain.contract.service.ContractService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/contracts")
@RequiredArgsConstructor
public class ContractController implements ContractControllerDocs {

    private final ContractService contractService;

    @Override
    @PostMapping("/{employeeId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ContractResponseDto.ContractDetail> createContract(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long employeeId,
            @Valid @RequestBody ContractRequestDto.Create request) {

        ContractResponseDto.ContractDetail response = contractService.createContract(userId, storeId, employeeId, request);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping
    public ApiResponse<List<ContractResponseDto.ContractSummary>> getStoreContracts(
            @AuthUser Long userId,
            @PathVariable Long storeId) {

        List<ContractResponseDto.ContractSummary> response = contractService.getStoreContracts(userId, storeId);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/{contractId}")
    public ApiResponse<ContractResponseDto.ContractDetail> getContract(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long contractId) {

        ContractResponseDto.ContractDetail response = contractService.getContract(userId, storeId, contractId);
        return ApiResponse.success(response);
    }

    @Override
    @PatchMapping("/{contractId}/sign/owner")
    public ApiResponse<ContractResponseDto.ContractDetail> signByOwner(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long contractId,
            @Valid @RequestBody ContractRequestDto.Sign request) {

        ContractResponseDto.ContractDetail response = contractService.signByOwner(userId, storeId, contractId, request);
        return ApiResponse.success(response);
    }

    @Override
    @PatchMapping("/{contractId}/sign/employee")
    public ApiResponse<ContractResponseDto.ContractDetail> signByEmployee(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long contractId,
            @Valid @RequestBody ContractRequestDto.Sign request) {

        ContractResponseDto.ContractDetail response = contractService.signByEmployee(userId, storeId, contractId, request);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/{contractId}/pdf")
    public ResponseEntity<?> downloadContractPdf(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long contractId) {

        Resource resource = contractService.downloadContractPdf(userId, storeId, contractId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"contract_" + contractId + ".pdf\"")
                .body(resource);
    }

    @Override
    @GetMapping("/me")
    public ApiResponse<List<ContractResponseDto.ContractSummary>> getMyContracts(
            @AuthUser Long userId,
            @PathVariable Long storeId) {

        List<ContractResponseDto.ContractSummary> response = contractService.getMyContracts(userId, storeId);
        return ApiResponse.success(response);
    }
}
