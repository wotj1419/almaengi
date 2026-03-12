package com.almaengi.be.domain.user.repository;

import com.almaengi.be.domain.user.entity.UserFcmToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserFcmTokenRepository extends JpaRepository<UserFcmToken, Long> {
    // 이 유저에게 등록된 모든 기기 토큰 목록 찾기 (나중에 푸시 발송 시 사용됨)
    List<UserFcmToken> findAllByUserId(Long userId);
    // 저장 시 이미 있는 토큰인지 확인하기 위해 사용
    Optional<UserFcmToken> findByDeviceToken(String deviceToken);
    void deleteByDeviceToken(String deviceToken);
}
