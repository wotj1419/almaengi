package com.almaengi.be.domain.auth.service;

import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @InjectMocks
    private TokenService tokenService;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private RedisTokenRepository redisTokenRepository;

    @Mock
    private UserRepository userRepository;

    // ===== 토큰 생성 테스트 =====

    @Nested
    @DisplayName("토큰 생성")
    class CreateTokens {

        @Test
        @DisplayName("성공 — AT, RT가 생성되고 Redis에 RT가 저장된다")
        void createTokens_success() {
            // given
            given(jwtProvider.createAccessToken(1L, Role.OWNER)).willReturn("new-at");
            given(jwtProvider.createRefreshToken(1L)).willReturn("new-rt");
            given(jwtProvider.getRefreshTokenExpiry()).willReturn(1209600000L);

            // when
            TokenService.TokenPair result = tokenService.createTokens(1L, Role.OWNER);

            // then
            assertThat(result.accessToken()).isEqualTo("new-at");
            assertThat(result.refreshToken()).isEqualTo("new-rt");
            verify(redisTokenRepository).saveRefreshToken(eq(1L), eq("new-rt"), eq(1209600000L));
        }
    }

    // ===== 토큰 재발급 테스트 =====

    @Nested
    @DisplayName("토큰 재발급")
    class Reissue {

        @Test
        @DisplayName("성공 — 유효한 RT로 새 AT+RT가 발급된다")
        void reissue_success() {
            // given
            String oldRefreshToken = "old-rt";
            Claims claims = Mockito.mock(Claims.class);

            User user = User.builder()
                    .loginType(LoginType.LOCAL)
                    .email("test@test.com")
                    .password("encodedPassword")
                    .name("테스트")
                    .role(Role.OWNER)
                    .build();

            given(jwtProvider.parseToken(oldRefreshToken)).willReturn(claims);
            given(jwtProvider.getType(claims)).willReturn("refresh");
            given(jwtProvider.getUserId(claims)).willReturn(1L);
            given(redisTokenRepository.getRefreshToken(1L)).willReturn(oldRefreshToken);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            // createTokens 내부 동작
            given(jwtProvider.createAccessToken(1L, Role.OWNER)).willReturn("new-at");
            given(jwtProvider.createRefreshToken(1L)).willReturn("new-rt");
            given(jwtProvider.getRefreshTokenExpiry()).willReturn(1209600000L);

            // when
            TokenService.TokenPair result = tokenService.reissue(oldRefreshToken);

            // then
            assertThat(result.accessToken()).isEqualTo("new-at");
            assertThat(result.refreshToken()).isEqualTo("new-rt");
        }

        @Test
        @DisplayName("실패 — 만료된 RT는 REFRESH_TOKEN_EXPIRED")
        void reissue_expiredToken_throwsException() {
            // given
            given(jwtProvider.parseToken("expired-rt"))
                    .willThrow(new ExpiredJwtException(null, null, "토큰 만료"));

            // when & then
            assertThatThrownBy(() -> tokenService.reissue("expired-rt"))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.REFRESH_TOKEN_EXPIRED));
        }

        @Test
        @DisplayName("실패 — 위조된 RT는 INVALID_TOKEN")
        void reissue_tamperedToken_throwsException() {
            // given
            given(jwtProvider.parseToken("tampered-rt"))
                    .willThrow(new io.jsonwebtoken.security.SignatureException("서명 불일치"));

            // when & then
            assertThatThrownBy(() -> tokenService.reissue("tampered-rt"))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.INVALID_TOKEN));
        }

        @Test
        @DisplayName("실패 — Redis의 RT와 불일치하면 RT 삭제 + REFRESH_TOKEN_MISMATCH")
        void reissue_mismatchToken_deletesAndThrows() {
            // given
            String requestToken = "stolen-rt";
            Claims claims = Mockito.mock(Claims.class);

            given(jwtProvider.parseToken(requestToken)).willReturn(claims);
            given(jwtProvider.getType(claims)).willReturn("refresh");
            given(jwtProvider.getUserId(claims)).willReturn(1L);
            given(redisTokenRepository.getRefreshToken(1L)).willReturn("real-rt"); // 불일치!

            // when & then
            assertThatThrownBy(() -> tokenService.reissue(requestToken))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.REFRESH_TOKEN_MISMATCH));

            // RT 삭제 확인 (탈취 대응)
            verify(redisTokenRepository).deleteRefreshToken(1L);
        }

        @Test
        @DisplayName("실패 — Redis에 RT가 없으면 REFRESH_TOKEN_MISMATCH")
        void reissue_noTokenInRedis_throwsException() {
            // given
            String requestToken = "some-rt";
            Claims claims = Mockito.mock(Claims.class);

            given(jwtProvider.parseToken(requestToken)).willReturn(claims);
            given(jwtProvider.getType(claims)).willReturn("refresh");
            given(jwtProvider.getUserId(claims)).willReturn(1L);
            given(redisTokenRepository.getRefreshToken(1L)).willReturn(null); // Redis에 없음

            // when & then
            assertThatThrownBy(() -> tokenService.reissue(requestToken))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.REFRESH_TOKEN_MISMATCH));

            verify(redisTokenRepository).deleteRefreshToken(1L);
        }
    }
}
