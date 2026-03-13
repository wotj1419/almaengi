package com.almaengi.be.domain.store.controller.docs;

import com.almaengi.be.domain.store.dto.StoreRequestDto;
import com.almaengi.be.domain.store.dto.StoreResponseDto;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Tag(name = "Store", description = "매장 관리 API")
public interface StoreControllerDocs {

    @Operation(summary = "매장 생성", description = "새로운 매장을 등록합니다.")
    ApiResponse<StoreResponseDto.StoreInfo> createStore(
            @AuthUser Long userId,
            @RequestBody StoreRequestDto.Create request
    );

    @Operation(summary = "내 매장 목록 조회", description = "로그인한 사장님이 소유한 모든 매장 목록을 조회합니다.")
    ApiResponse<List<StoreResponseDto.StoreInfo>> getMyStores(
            @AuthUser Long userId
    );

    @Operation(summary = "단일 매장 상세 조회", description = "특정 매장의 상세 정보를 조회합니다.")
    ApiResponse<StoreResponseDto.StoreInfo> getStore(
            @AuthUser Long userId,
            @Parameter(description = "조회할 매장의 ID", example = "1") @PathVariable("storeId") Long storeId
    );

    @Operation(summary = "매장 정보 수정", description = "사장이 자신의 매장 정보를 수정합니다.")
    ApiResponse<StoreResponseDto.StoreInfo> updateStore(
            @AuthUser Long userId,
            @Parameter(description = "수정할 매장의 ID", example = "1") @PathVariable("storeId") Long storeId,
            @RequestBody StoreRequestDto.Update request
    );

    @Operation(summary = "매장 폐업(삭제)", description = "사장이 자신의 매장을 논리 삭제(is_closed=true) 처리합니다.")
    ApiResponse<Void> deleteStore(
            @AuthUser Long userId,
            @Parameter(description = "삭제할 매장의 ID", example = "1") @PathVariable("storeId") Long storeId
    );
}
