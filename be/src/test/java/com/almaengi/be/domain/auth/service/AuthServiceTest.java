package com.almaengi.be.domain.auth.service;

import com.almaengi.be.domain.auth.dto.AuthRequestDto;
import com.almaengi.be.domain.auth.dto.AuthResponseDto;
import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenService tokenService;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private RedisTokenRepository redisTokenRepository;

    // ===== 테스트용 헬퍼 메서드 =====

    private User createUser(Long userId, String email, boolean isWithdraw) {
        User user = User.builder()
                .loginType(LoginType.LOCAL)
                .email(email)
                .password("encodedPassword")
                .name("테스트")
                .role(Role.OWNER)
                .build();
        ReflectionTestUtils.setField(user, "id", userId);
        ReflectionTestUtils.setField(user, "isWithdraw", isWithdraw);
        return user;
    }

    private AuthRequestDto.Signup createSignupRequest() {
        AuthRequestDto.Signup request = new AuthRequestDto.Signup();
        ReflectionTestUtils.setField(request, "email", "test@test.com");
        ReflectionTestUtils.setField(request, "password", "Password1!");
        ReflectionTestUtils.setField(request, "name", "테스트");
        ReflectionTestUtils.setField(request, "phone", "010-1234-5678");
        ReflectionTestUtils.setField(request, "role", Role.OWNER);
        return request;
    }

    private AuthRequestDto.Login createLoginRequest() {
        AuthRequestDto.Login request = new AuthRequestDto.Login();
        ReflectionTestUtils.setField(request, "email", "test@test.com");
        ReflectionTestUtils.setField(request, "password", "Password1!");
        return request;
    }

    // ===== 회원가입 테스트 =====

    @Nested
    @DisplayName("회원가입")
    class Signup {

        @Test
        @DisplayName("성공 — 유저가 생성되고 응답이 반환된다")
        void signup_success() {
            // given
            AuthRequestDto.Signup request = createSignupRequest();
            User savedUser = createUser(1L, "test@test.com", false);

            given(userRepository.existsByEmail("test@test.com")).willReturn(false);
            given(passwordEncoder.encode("Password1!")).willReturn("encodedPassword");
            given(userRepository.save(any(User.class))).willReturn(savedUser);

            // when
            AuthResponseDto.Signup response = authService.signup(request);

            // then
            assertThat(response.getUserId()).isEqualTo(1L);
            assertThat(response.getEmail()).isEqualTo("test@test.com");
            assertThat(response.getName()).isEqualTo("테스트");
            assertThat(response.getRole()).isEqualTo(Role.OWNER);
        }

        @Test
        @DisplayName("실패 — 이메일 중복 시 DUPLICATE_EMAIL 예외")
        void signup_duplicateEmail_throwsException() {
            // given
            AuthRequestDto.Signup request = createSignupRequest();
            given(userRepository.existsByEmail("test@test.com")).willReturn(true);

            // when & then
            assertThatThrownBy(() -> authService.signup(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.DUPLICATE_EMAIL));
        }

        @Test
        @DisplayName("실패 — 비밀번호 인코딩 예외 시 INVALID_PASSWORD_FORMAT")
        void signup_passwordEncodeError_throwsInvalidPasswordFormat() {
            // given
            AuthRequestDto.Signup request = createSignupRequest();
            given(userRepository.existsByEmail("test@test.com")).willReturn(false);
            given(passwordEncoder.encode("Password1!"))
                    .willThrow(new IllegalArgumentException("password cannot be more than 72 bytes"));

            // when & then
            assertThatThrownBy(() -> authService.signup(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.INVALID_PASSWORD_FORMAT));

            verify(userRepository, never()).save(any(User.class));
        }
    }

    // ===== 로그인 테스트 =====

    @Nested
    @DisplayName("로그인")
    class Login {

        @Test
        @DisplayName("성공 — AT가 포함된 응답이 반환된다")
        void login_success() {
            // given
            AuthRequestDto.Login request = createLoginRequest();
            User user = createUser(1L, "test@test.com", false);
            TokenService.TokenPair tokenPair = new TokenService.TokenPair("access-token", "refresh-token");

            given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("Password1!", "encodedPassword")).willReturn(true);
            given(tokenService.createTokens(1L, Role.OWNER)).willReturn(tokenPair);

            // when
            AuthResponseDto.Login response = authService.login(request);

            // then
            assertThat(response.getUserId()).isEqualTo(1L);
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        }

        @Test
        @DisplayName("실패 — 존재하지 않는 이메일이면 INVALID_CREDENTIALS")
        void login_emailNotFound_throwsException() {
            // given
            AuthRequestDto.Login request = createLoginRequest();
            given(userRepository.findByEmail("test@test.com")).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.INVALID_CREDENTIALS));
        }

        @Test
        @DisplayName("실패 — 비밀번호 불일치 시 INVALID_CREDENTIALS")
        void login_wrongPassword_throwsException() {
            // given
            AuthRequestDto.Login request = createLoginRequest();
            User user = createUser(1L, "test@test.com", false);

            given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("Password1!", "encodedPassword")).willReturn(false);

            // when & then
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.INVALID_CREDENTIALS));
        }

        @Test
        @DisplayName("실패 — 탈퇴한 유저는 WITHDRAWN_USER")
        void login_withdrawnUser_throwsException() {
            // given
            AuthRequestDto.Login request = createLoginRequest();
            User user = createUser(1L, "test@test.com", true); // isWithdraw = true

            given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));

            // when & then
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.WITHDRAWN_USER));
        }
    }

    // ===== 이메일 중복 체크 테스트 =====

    @Nested
    @DisplayName("이메일 중복 체크")
    class CheckEmail {

        @Test
        @DisplayName("이메일이 존재하면 exists=true")
        void checkEmail_exists() {
            given(userRepository.existsByEmail("test@test.com")).willReturn(true);

            AuthResponseDto.EmailCheck response = authService.emailCheck("test@test.com");

            assertThat(response.isExists()).isTrue();
        }

        @Test
        @DisplayName("이메일이 없으면 exists=false")
        void checkEmail_notExists() {
            given(userRepository.existsByEmail("test@test.com")).willReturn(false);

            AuthResponseDto.EmailCheck response = authService.emailCheck("test@test.com");

            assertThat(response.isExists()).isFalse();
        }
    }

    // ===== 로그아웃 테스트 =====

    @Nested
    @DisplayName("로그아웃")
    class Logout {

        @Test
        @DisplayName("성공 — RT 삭제 + AT 블랙리스트 등록")
        void logout_success() {
            // given
            String accessToken = "access-token";
            Claims claims = org.mockito.Mockito.mock(Claims.class);

            given(jwtProvider.parseExpiredToken(accessToken)).willReturn(claims);
            given(jwtProvider.getUserId(claims)).willReturn(1L);
            given(jwtProvider.getJti(claims)).willReturn("jti-uuid");
            given(jwtProvider.getRemainingExpiration(claims)).willReturn(600000L); // 10분

            // when
            authService.logout(accessToken);

            // then
            verify(redisTokenRepository).deleteRefreshToken(1L);
            verify(redisTokenRepository).addToBlacklist(eq("jti-uuid"), eq("logout"), eq(600000L));
        }
    }

    // ===== 회원 탈퇴 테스트 =====

    @Nested
    @DisplayName("회원 탈퇴")
    class Withdraw {

        @Test
        @DisplayName("성공 — LOCAL 유저 비밀번호 확인 후 소프트삭제")
        void withdraw_localUser_success() {
            // given
            String accessToken = "access-token";
            AuthRequestDto.Withdraw request = new AuthRequestDto.Withdraw();
            ReflectionTestUtils.setField(request, "password", "Password1!");

            User user = createUser(1L, "test@test.com", false);
            Claims claims = org.mockito.Mockito.mock(Claims.class);

            given(jwtProvider.parseExpiredToken(accessToken)).willReturn(claims);
            given(jwtProvider.getUserId(claims)).willReturn(1L);
            given(jwtProvider.getJti(claims)).willReturn("jti-uuid");
            given(jwtProvider.getRemainingExpiration(claims)).willReturn(600000L);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(passwordEncoder.matches("Password1!", "encodedPassword")).willReturn(true);

            // when
            authService.withdraw(accessToken, request);

            // then
            assertThat(user.getIsWithdraw()).isTrue();
            assertThat(user.getWithdrawnAt()).isNotNull();
            verify(redisTokenRepository).deleteRefreshToken(1L);
            verify(redisTokenRepository).addToBlacklist(eq("jti-uuid"), eq("withdraw"), eq(600000L));
        }

        @Test
        @DisplayName("실패 — LOCAL 유저 비밀번호 불일치 시 INVALID_CREDENTIALS")
        void withdraw_wrongPassword_throwsException() {
            // given
            String accessToken = "access-token";
            AuthRequestDto.Withdraw request = new AuthRequestDto.Withdraw();
            ReflectionTestUtils.setField(request, "password", "WrongPassword1!");

            User user = createUser(1L, "test@test.com", false);
            Claims claims = org.mockito.Mockito.mock(Claims.class);

            given(jwtProvider.parseExpiredToken(accessToken)).willReturn(claims);
            given(jwtProvider.getUserId(claims)).willReturn(1L);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(passwordEncoder.matches("WrongPassword1!", "encodedPassword")).willReturn(false);

            // when & then
            assertThatThrownBy(() -> authService.withdraw(accessToken, request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.INVALID_CREDENTIALS));
        }
    }

    // ===== 토큰 재발급 테스트 =====

    @Nested
    @DisplayName("토큰 재발급")
    class Reissue {

        @Test
        @DisplayName("성공 — TokenService에 위임하여 새 토큰쌍을 반환한다")
        void reissueTokens_success() {
            // given
            String refreshToken = "old-rt";
            TokenService.TokenPair tokenPair = new TokenService.TokenPair("new-at", "new-rt");
            given(tokenService.reissue(refreshToken)).willReturn(tokenPair);

            // when
            TokenService.TokenPair result = authService.reissueTokens(refreshToken);

            // then
            assertThat(result.accessToken()).isEqualTo("new-at");
            assertThat(result.refreshToken()).isEqualTo("new-rt");
            verify(tokenService).reissue(refreshToken);
        }

        @Test
        @DisplayName("실패 — refreshToken이 null이면 REFRESH_TOKEN_EXPIRED")
        void reissueTokens_nullToken_throwsException() {
            // when & then
            assertThatThrownBy(() -> authService.reissueTokens(null))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.REFRESH_TOKEN_EXPIRED));
        }
    }
}
