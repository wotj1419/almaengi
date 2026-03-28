package com.almaengi.be.domain.store.controller.docs;

import com.almaengi.be.domain.store.dto.StoreEmployeeRequestDto;
import com.almaengi.be.domain.store.dto.StoreEmployeeResponseDto;
import com.almaengi.be.domain.store.dto.StoreResponseDto;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.validation.Valid;

import java.util.List;

@Tag(name = "Store Employee API", description = "매장 직원 초대 및 가입 API")
public interface StoreEmployeeControllerDocs {

    @Operation(summary = "매장 초대 코드 발급", description = "사장님이 특정 매장의 초대 코드를 발급받습니다.")
    ApiResponse<StoreEmployeeResponseDto.InviteCodeInfo> generateInviteCode(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "초대 코드를 발급할 매장 ID (PathVariable)", example = "1")
            @PathVariable("storeId") Long storeId
    );

    @Operation(summary = "매장 합류 신청", description = "알바생이 초대 코드를 입력하여 매장에 대기 상태(WAITING)로 등록됩니다. 사장 승인 후 WORKING 전환됩니다.")
    ApiResponse<StoreEmployeeResponseDto.EmployeeInfo> joinStore(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Valid @RequestBody StoreEmployeeRequestDto.Join request
    );
    @Operation(summary = "직원 합류 승인", description = "사장님이 대기 상태(WAITING) 직원을 승인하여 WORKING 상태로 전환합니다.")
    ApiResponse<StoreEmployeeResponseDto.EmployeeInfo> approveEmployee(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable("storeId") Long storeId,
            @Parameter(description = "직원 ID (StoreEmployee PK)", example = "10") @PathVariable("employeeId") Long employeeId
    );

    @Operation(summary = "내 소속 매장 목록 조회", description = "직원으로 소속된 매장 중 재직 중이며 폐업되지 않은 매장 목록을 조회합니다.")
    ApiResponse<List<StoreResponseDto.StoreInfo>> getMyStoresEmployee(
            @Parameter(hidden = true) @AuthUser Long userId
    );

    @Operation(summary = "매장 직원 목록 조회", description = "사장님이 자신의 매장에 소속된 모든 직원의 목록을 조회합니다.")
    ApiResponse<List<StoreEmployeeResponseDto.EmployeeInfo>> getStoreEmployees(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable("storeId") Long storeId
    );

    @Operation(summary = "상태별 직원 목록 조회", description = "사장님이 특정 상태의 직원 목록을 조회합니다. status는 StoreEmployeeStatus enum 전체를 사용할 수 있습니다.")
    ApiResponse<List<StoreEmployeeResponseDto.EmployeeInfo>> getStatusEmployees(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable("storeId") Long storeId,
            @Parameter(description = "조회할 직원 상태", example = "WAITING") @RequestParam("status") StoreEmployeeStatus status
    );

    @Operation(summary = "직원 정보 수정", description = "사장님이 특정 직원의 시급, 직무 등을 수정합니다.")
    ApiResponse<StoreEmployeeResponseDto.EmployeeInfo> updateEmployeeInfo(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable("storeId") Long storeId,
            @Parameter(description = "직원 ID (StoreEmployee PK)", example = "10") @PathVariable("employeeId") Long employeeId,
            @Valid @RequestBody StoreEmployeeRequestDto.Update request
    );

    @Operation(summary = "직원 삭제(퇴사)", description = "사장님이 특정 직원을 매장에서 퇴사 처리합니다.")
    ApiResponse<Void> removeEmployee(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "매장 ID", example = "1") @PathVariable("storeId") Long storeId,
            @Parameter(description = "직원 ID", example = "10") @PathVariable("employeeId") Long employeeId
    );

}
