package com.almaengi.be.global.security.jwt;

import com.almaengi.be.domain.user.type.Role;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtProviderTest {

    private JwtProvider jwtProvider;

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider();

        // 리플렉션으로 @Value 필드 주입 (Spring 없이 테스트)
        ReflectionTestUtils.setField(jwtProvider, "secretKeyString",
                "TestSecretKeyForHS256AlgorithmMustBeAtLeast32BytesLong!");
        ReflectionTestUtils.setField(jwtProvider, "accessTokenExpiry", 1800000L);  // 30분
        ReflectionTestUtils.setField(jwtProvider, "refreshTokenExpiry", 1209600000L); // 14일

        // @PostConstruct 수동 호출
        jwtProvider.init();
    }

    @Test
    @DisplayName("AT 생성 후 파싱하면 userId, role, jti를 추출할 수 있다")
    void createAccessToken_thenParseClaims() {
        // given
        Long userId = 1L;
        Role role = Role.OWNER;

        // when
        String token = jwtProvider.createAccessToken(userId, role);
        Claims claims = jwtProvider.parseToken(token);

        // then
        assertThat(jwtProvider.getUserId(claims)).isEqualTo(userId);
        assertThat(jwtProvider.getRole(claims)).isEqualTo("OWNER");
        assertThat(jwtProvider.getJti(claims)).isNotNull();
    }

    @Test
    @DisplayName("RT 생성 후 파싱하면 userId를 추출할 수 있고 role은 null이다")
    void createRefreshToken_thenParseUserId() {
        // given
        Long userId = 1L;

        // when
        String token = jwtProvider.createRefreshToken(userId);
        Claims claims = jwtProvider.parseToken(token);

        // then
        assertThat(jwtProvider.getUserId(claims)).isEqualTo(userId);
        assertThat(jwtProvider.getRole(claims)).isNull();
    }

    @Test
    @DisplayName("role이 null인 AT를 생성하면 role 클레임이 없다")
    void createAccessToken_withNullRole_thenNoRoleClaim() {
        // when
        String token = jwtProvider.createAccessToken(1L, null);
        Claims claims = jwtProvider.parseToken(token);

        // then
        assertThat(jwtProvider.getRole(claims)).isNull();
        assertThat(jwtProvider.getJti(claims)).isNotNull();
    }

    @Test
    @DisplayName("유효한 토큰은 validateToken이 true를 반환한다")
    void validateToken_withValidToken_returnsTrue() {
        // given
        String token = jwtProvider.createAccessToken(1L, Role.EMPLOYEE);

        // then
        assertThat(jwtProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("만료된 토큰은 validateToken이 false를 반환한다")
    void validateToken_withExpiredToken_returnsFalse() {
        // given — 만료 시간을 0으로 설정
        ReflectionTestUtils.setField(jwtProvider, "accessTokenExpiry", 0L);
        jwtProvider.init();

        String token = jwtProvider.createAccessToken(1L, Role.OWNER);

        // then
        assertThat(jwtProvider.validateToken(token)).isFalse();
    }

    @Test
    @DisplayName("만료된 토큰도 parseExpiredToken으로 Claims를 추출할 수 있다")
    void parseExpiredToken_extractsClaims() {
        // given — 만료 시간을 0으로 설정
        ReflectionTestUtils.setField(jwtProvider, "accessTokenExpiry", 0L);
        jwtProvider.init();

        String token = jwtProvider.createAccessToken(1L, Role.OWNER);

        // when
        Claims claims = jwtProvider.parseExpiredToken(token);

        // then
        assertThat(jwtProvider.getUserId(claims)).isEqualTo(1L);
        assertThat(jwtProvider.getJti(claims)).isNotNull();
    }

    @Test
    @DisplayName("위조된 토큰은 validateToken이 false를 반환한다")
    void validateToken_withTamperedToken_returnsFalse() {
        // given
        String token = jwtProvider.createAccessToken(1L, Role.OWNER);
        String tamperedToken = token + "tampered";

        // then
        assertThat(jwtProvider.validateToken(tamperedToken)).isFalse();
    }

    @Test
    @DisplayName("getRemainingExpiration은 양수를 반환한다")
    void getRemainingExpiration_returnsPositive() {
        // given
        String token = jwtProvider.createAccessToken(1L, Role.OWNER);
        Claims claims = jwtProvider.parseToken(token);

        // then
        assertThat(jwtProvider.getRemainingExpiration(claims)).isGreaterThan(0);
    }

    @Test
    @DisplayName("AT의 type은 'access'이고, RT의 type은 'refresh'이다")
    void getType_returnsCorrectType() {
        // given
        String accessToken = jwtProvider.createAccessToken(1L, Role.OWNER);
        String refreshToken = jwtProvider.createRefreshToken(1L);

        // when
        Claims atClaims = jwtProvider.parseToken(accessToken);
        Claims rtClaims = jwtProvider.parseToken(refreshToken);

        // then
        assertThat(jwtProvider.getType(atClaims)).isEqualTo("access");
        assertThat(jwtProvider.getType(rtClaims)).isEqualTo("refresh");
    }
}
