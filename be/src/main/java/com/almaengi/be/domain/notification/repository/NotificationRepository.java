package com.almaengi.be.domain.notification.repository;

import com.almaengi.be.domain.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // 특정 유저의 알림함 목록 불러오기
    // 최신 알림이 위로 오도록 정렬
    List<Notification> findAllByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    // 읽지 않은 알림의 개수.
    long countByReceiverIdAndIsReadFalse(Long receiverId);

    @Query("SELECT n FROM Notification n WHERE n.id IN :ids")
    List<Notification> findAllById(List<Long> ids);
}
