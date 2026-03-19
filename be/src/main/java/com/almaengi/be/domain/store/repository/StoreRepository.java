package com.almaengi.be.domain.store.repository;

import com.almaengi.be.domain.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {

    // 특정 사장님이 소유한 매장 목록 조회
    List<Store> findByOwnerIdAndIsClosedFalse(Long userId);
    Optional<Store> findByIdAndIsClosedFalse(Long storeId);
    List<Store> findByOwnerId(Long userId);
    Optional<Store> findByQrCode(String qrCode);

    /**
     * 운영 중인 매장 + 사장님(owner)을 함께 조회합니다.
     * JOIN FETCH로 owner를 즉시 로딩하여,
     * @Transactional 없는 스케줄러에서도 store.getOwner()가 정상 동작합니다.
     */
    @Query("SELECT s FROM Store s JOIN FETCH s.owner WHERE s.isClosed = false")
    List<Store> findOpenStoresWithOwner();
}
