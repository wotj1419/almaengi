package com.almaengi.be.global.security.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;

@Repository
@RequiredArgsConstructor
public class RedisTokenRepository {

    private final RedisTemplate<String, Object> redisTemplate;

    public static final String RT_PREFIX = "RT:";
    public static final String BL_PREFIX = "BL:";

    // Refresh Token 저장
    public void saveRefreshToken(Long userId, String refreshToken, long expiryMs) {
        redisTemplate.opsForValue().set(
                RT_PREFIX + userId,
                refreshToken,
                expiryMs,
                TimeUnit.MILLISECONDS
        );
    }

    // Refresh Token 조회
    public String getRefreshToken(Long userId) {
        return (String) redisTemplate.opsForValue().get(RT_PREFIX + userId);
    }

    // Refresh Token 삭제
    public void deleteRefreshToken(Long userId) {
        redisTemplate.delete(RT_PREFIX + userId);
    }

    // Access Token 블랙리스트 등록
    public void addToBlacklist(String jti, String reason, long remainingMs) {
        redisTemplate.opsForValue().set(
                BL_PREFIX + jti,
                reason,
                remainingMs,
                TimeUnit.MILLISECONDS
        );
    }

    // 블랙리스트 여부 확인
    public boolean isBlacklisted(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BL_PREFIX + jti));
    }
}
