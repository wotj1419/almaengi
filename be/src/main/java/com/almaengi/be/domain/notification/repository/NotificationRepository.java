package com.almaengi.be.domain.notification.repository;

import com.almaengi.be.domain.notification.entity.Notification;
import com.almaengi.be.domain.notification.type.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // 특정 유저의 알림함 목록 불러오기
    // 최신 알림이 위로 오도록 정렬
    List<Notification> findAllByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    // 읽지 않은 알림의 개수.
    long countByReceiverIdAndIsReadFalse(Long receiverId);

    @Query("SELECT n FROM Notification n WHERE n.id IN :ids")
    List<Notification> findAllById(List<Long> ids);

    /**
     * 당일 지각 알림 중복 체크용.
     * 수신자 + 타입(LATE) + targetId(employeeId) + 오늘 00:00 이후 생성분이 있는지 확인합니다.
     * GreaterThanEqual(>=)로 정각 생성 알림도 포함합니다.
     */
    boolean existsByReceiverIdAndTypeAndTargetIdAndCreatedAtGreaterThanEqual(
            Long receiverId, NotificationType type, Long targetId, LocalDateTime startOfDay);
}
