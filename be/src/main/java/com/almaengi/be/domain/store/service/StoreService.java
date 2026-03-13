package com.almaengi.be.domain.store.service;

import com.almaengi.be.domain.store.dto.StoreRequestDto;
import com.almaengi.be.domain.store.dto.StoreResponseDto;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreService {
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    // 매장 정보 등록(create)
    @Transactional
    public StoreResponseDto.StoreInfo createStore(Long userId, StoreRequestDto.Create request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Store store = Store.builder()
                .owner(owner)
                .name(request.getStoreName())
                .address(request.getAddress())
                .phone(request.getPhone())
                .isOver5Employees(request.getIsOver5Employees())
                .qrCode(UUID.randomUUID().toString())
                .build();

        Store savedStore = storeRepository.save(store);
        return StoreResponseDto.StoreInfo.from(savedStore);
    }

    // 내가 소유한 매장 목록 전체 조회
    public List<StoreResponseDto.StoreInfo> getMyStores(Long userId) {
        List<Store> myStores = storeRepository.findByOwnerIdAndIsClosedFalse(userId);
        return myStores.stream()
                .map(StoreResponseDto.StoreInfo::from)
                .toList();
    }

    // 특정 매장 단건 조회
    public StoreResponseDto.StoreInfo getStore(Long userId, Long storeId) {
        Store store = storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if(!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }

        return StoreResponseDto.StoreInfo.from(store);
    }

    @Transactional
    public StoreResponseDto.StoreInfo updateStore(Long userId, Long storeId, StoreRequestDto.Update request) {
        Store store = storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if(!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }

        store.updateStoreInfo(request.getStoreName(), request.getAddress(), request.getPhone(), request.getIsOver5Employees());
        return StoreResponseDto.StoreInfo.from(store);
    }

    @Transactional
    public void deleteStore(Long userId, Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if(!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }

        store.closeStore();
    }
}
