package com.almaengi.be.domain.auth.service;

import com.almaengi.be.domain.auth.dto.AuthRequestDto;
import com.almaengi.be.domain.auth.dto.AuthResponseDto;
import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final JwtProvider jwtProvider;
    private final RedisTokenRepository redisTokenRepository;

    // 회원가입
    @Transactional
    public AuthResponseDto.Signup signup(AuthRequestDto.Signup request) {
        String email = request.getEmail().toLowerCase(Locale.ROOT);

        // 1. 이메일 중복 체크
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        // 2. User 엔티티 생성 + 비밀번호 해싱
        User user = User.builder()
                .loginType(LoginType.LOCAL)
                .email(email)
                .password(encodePassword(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .role(request.getRole())
                .build();

        // 3. 저장
        User savedUser = userRepository.save(user);

        // 4. 응답
        return AuthResponseDto.Signup.from(savedUser);
    }

    // 로그인
    @Transactional
    public AuthResponseDto.Login login(AuthRequestDto.Login request) {
        String email = request.getEmail().toLowerCase(Locale.ROOT);

        // 1. 이메일로 유저 조회 (없으면 INVALID_CREDENTIALS)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        // 2. 탈퇴 유저 확인
        if (user.getIsWithdraw()) {
            throw new BusinessException(ErrorCode.WITHDRAWN_USER);
        }

        // 3. 비밀번호 매칭 (틀려도 INVALID_CREDENTIALS — 이메일 존재 여부 미노출)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        // 4. AT + RT 발급
        TokenService.TokenPair tokenPair = tokenService.createTokens(
                user.getId(), user.getRole());

        // 5. 응답 (AT는 바디, RT는 Controller에서 Cookie로)
        return AuthResponseDto.Login.from(user, tokenPair.accessToken(), tokenPair.refreshToken());
    }

    // 토큰 재발급
    public TokenService.TokenPair reissueTokens(String refreshToken) {
        if (refreshToken == null) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        return tokenService.reissue(refreshToken);
    }

    // 로그아웃
    public void logout(String accessToken) {
        // 1. AT에서 정보 추출 (만료되었더라도 파싱 가능)
        Claims claims = jwtProvider.parseExpiredToken(accessToken);
        Long userId = jwtProvider.getUserId(claims);
        String jti = jwtProvider.getJti(claims);
        long remainingMs = jwtProvider.getRemainingExpiration(claims);

        // 2. Redis에서 RT 삭제
        redisTokenRepository.deleteRefreshToken(userId);

        // 3. AT를 블랙리스트에 등록 (잔여 시간만큼만)
        if (remainingMs > 0) {
            redisTokenRepository.addToBlacklist(jti, "logout", remainingMs);
        }
    }

    // 회원 탈퇴
    @Transactional
    public void withdraw(String accessToken, AuthRequestDto.Withdraw request) {
        // 1. AT에서 userId 추출
        Claims claims = jwtProvider.parseExpiredToken(accessToken);
        Long userId = jwtProvider.getUserId(claims);

        // 2. 유저 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 3. LOCAL 유저는 비밀번호 재확인
        if (user.getLoginType() == LoginType.LOCAL) {
            if (request == null || request.getPassword() == null ||
                    !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
            }
        }

        // 4. 소프트 삭제
        user.withdraw();

        // 5. RT 삭제 + AT 블랙리스트
        String jti = jwtProvider.getJti(claims);
        long remainingMs = jwtProvider.getRemainingExpiration(claims);

        redisTokenRepository.deleteRefreshToken(userId);
        if (remainingMs > 0) {
            redisTokenRepository.addToBlacklist(jti, "withdraw", remainingMs);
        }
    }

    // 이메일 중복 체크
    public AuthResponseDto.EmailCheck emailCheck(String email) {
        return AuthResponseDto.EmailCheck.builder()
                .exists(userRepository.existsByEmail(email.toLowerCase(Locale.ROOT)))
                .build();
    }

    // 비밀번호 인코딩 (BCrypt 예외 → BusinessException 변환)
    private String encodePassword(String rawPassword) {
        try {
            return passwordEncoder.encode(rawPassword);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD_FORMAT);
        }
    }
}
