package com.almaengi.be.domain.auth.service;

import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TokenService {

    private final JwtProvider jwtProvider;
    private final RedisTokenRepository redisTokenRepository;
    private final UserRepository userRepository;

    // AT + RT 생성 후 Redis에 RT 저장
    public TokenPair createTokens(Long userId, Role role) {
        String accessToken = jwtProvider.createAccessToken(userId, role);
        String refreshToken = jwtProvider.createRefreshToken(userId);

        redisTokenRepository.saveRefreshToken(
                userId,
                refreshToken,
                jwtProvider.getRefreshTokenExpiry()
        );

        return new TokenPair(accessToken, refreshToken);
    }

    // RT로 AT + RT 재발급
    public TokenPair reissue(String refreshToken) {
        // 1. RT 파싱 (만료 vs 위조/포맷오류 분리)
        Claims claims;
        try {
            claims = jwtProvider.parseToken(refreshToken);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        // type 검증 — AT가 들어오면 즉시 차단
        String type = jwtProvider.getType(claims);
        if (!"refresh".equals(type)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        Long userId = jwtProvider.getUserId(claims);

        // 3. Redis에 저장된 RT와 비교
        String savedToken = redisTokenRepository.getRefreshToken(userId);
        if (savedToken == null || !savedToken.equals(refreshToken)) {
            // 탈취 의심 → 해당 유저의 RT 삭제 (강제 로그아웃)
            redisTokenRepository.deleteRefreshToken(userId);
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_MISMATCH);
        }

        // 4. role 추출 (DB에서 role 조회)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 5. 새 AT + RT 발급 (RT Rotation)
        return createTokens(userId, user.getRole());
    }

    // AT + RT를 묶는 내부 record
    public record TokenPair(String accessToken, String refreshToken) {}
}
