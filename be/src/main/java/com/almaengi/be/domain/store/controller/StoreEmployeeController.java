package com.almaengi.be.domain.store.controller;

import com.almaengi.be.domain.store.controller.docs.StoreEmployeeControllerDocs;
import com.almaengi.be.domain.store.dto.StoreEmployeeRequestDto;
import com.almaengi.be.domain.store.dto.StoreEmployeeResponseDto;
import com.almaengi.be.domain.store.service.StoreEmployeeService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stores")
@RequiredArgsConstructor
public class StoreEmployeeController implements StoreEmployeeControllerDocs {
    private final StoreEmployeeService storeEmployeeService;

    @Override
    @PostMapping("/{storeId}/invite-code")
    public ApiResponse<StoreEmployeeResponseDto.InviteCodeInfo> generateInviteCode(@AuthUser Long userId, @PathVariable Long storeId) {
        StoreEmployeeResponseDto.InviteCodeInfo response = storeEmployeeService.generateInviteCode(userId, storeId);
        return ApiResponse.success(response);
    }

    @Override
    @PostMapping("/employees/join")
    public ApiResponse<StoreEmployeeResponseDto.EmployeeInfo> joinStore(@AuthUser Long userId,
                                                                        @Valid @RequestBody StoreEmployeeRequestDto.Join request) {
        StoreEmployeeResponseDto.EmployeeInfo response = storeEmployeeService.joinStore(userId, request);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/{storeId}/employees")
    public ApiResponse<List<StoreEmployeeResponseDto.EmployeeInfo>> getStoreEmployees(@AuthUser Long userId, @PathVariable Long storeId) {
        List<StoreEmployeeResponseDto.EmployeeInfo> response = storeEmployeeService.getStoreEmployees(userId, storeId);
        return ApiResponse.success(response);
    }

    @Override
    @PatchMapping("/{storeId}/employees/{employeeId}")
    public ApiResponse<StoreEmployeeResponseDto.EmployeeInfo> updateEmployeeInfo(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long employeeId,
            @Valid @RequestBody StoreEmployeeRequestDto.Update request
    ) {
        StoreEmployeeResponseDto.EmployeeInfo response = storeEmployeeService.updateEmployeeInfo(userId, storeId, employeeId, request);
        return ApiResponse.success(response);
    }

    @Override
    @DeleteMapping("/{storeId}/employees/{employeeId}")
    public ApiResponse<Void> removeEmployee(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @PathVariable Long employeeId
    ) {
        storeEmployeeService.removeEmployee(userId, storeId, employeeId);
        return ApiResponse.success();
    }
}
