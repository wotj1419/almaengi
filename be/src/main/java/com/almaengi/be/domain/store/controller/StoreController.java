package com.almaengi.be.domain.store.controller;

import com.almaengi.be.domain.store.controller.docs.StoreControllerDocs;
import com.almaengi.be.domain.store.dto.StoreRequestDto;
import com.almaengi.be.domain.store.dto.StoreResponseDto;
import com.almaengi.be.domain.store.service.StoreService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stores")
@RequiredArgsConstructor
public class StoreController implements StoreControllerDocs {
    private final StoreService storeService;

    @Override
    @PostMapping
    public ApiResponse<StoreResponseDto.StoreInfo> createStore(@AuthUser Long userId,
                                                               @Valid @RequestBody StoreRequestDto.Create request) {

        StoreResponseDto.StoreInfo response = storeService.createStore(userId, request);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping
    public ApiResponse<List<StoreResponseDto.StoreInfo>> getMyStores(@AuthUser Long userId) {
        List<StoreResponseDto.StoreInfo> response = storeService.getMyStores(userId);
        return ApiResponse.success(response);
    }

    @Override
    @GetMapping("/{storeId}")
    public ApiResponse<StoreResponseDto.StoreInfo> getStore(@AuthUser Long userId, @PathVariable("storeId") Long storeId) {
        StoreResponseDto.StoreInfo response = storeService.getStore(userId, storeId);
        return ApiResponse.success(response);
    }

    @Override
    @PutMapping("/{storeId}")
    public ApiResponse<StoreResponseDto.StoreInfo> updateStore(@AuthUser Long userId, @PathVariable("storeId") Long storeId,
                                                               @Valid @RequestBody StoreRequestDto.Update request) {
        StoreResponseDto.StoreInfo response = storeService.updateStore(userId, storeId, request);
        return ApiResponse.success(response);
    }

    @Override
    @DeleteMapping("/{storeId}")
    public ApiResponse<Void>  deleteStore(@AuthUser Long userId, @PathVariable("storeId") Long storeId) {
        storeService.deleteStore(userId, storeId);
        return ApiResponse.success();
    }
}
