package com.almaengi.be.domain.auth.controller;

import com.almaengi.be.domain.auth.dto.AuthRequestDto;
import com.almaengi.be.domain.auth.dto.AuthResponseDto;
import com.almaengi.be.domain.auth.service.AuthService;
import com.almaengi.be.domain.auth.service.TokenService;
import com.almaengi.be.domain.auth.util.RefreshTokenCookieProvider;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
})
@DisplayName("AuthController 단위 테스트")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private RefreshTokenCookieProvider cookieProvider;

    @MockitoBean
    private RedisTokenRepository redisTokenRepository;

    // === Helper Methods ===

    private AuthRequestDto.Signup createSignupRequest() {
        AuthRequestDto.Signup request = new AuthRequestDto.Signup();
        ReflectionTestUtils.setField(request, "email", "test@test.com");
        ReflectionTestUtils.setField(request, "password", "Test1234!");
        ReflectionTestUtils.setField(request, "name", "테스트");
        ReflectionTestUtils.setField(request, "phone", "01012345678");
        ReflectionTestUtils.setField(request, "role", Role.OWNER);
        return request;
    }

    private AuthRequestDto.Login createLoginRequest() {
        AuthRequestDto.Login request = new AuthRequestDto.Login();
        ReflectionTestUtils.setField(request, "email", "test@test.com");
        ReflectionTestUtils.setField(request, "password", "Test1234!");
        return request;
    }

    // === Test Classes ===

    @Nested
    @DisplayName("회원가입 API 테스트")
    class SignupTest {

        @Test
        @DisplayName("성공: 유효한 요청으로 회원가입한다")
        void signupSuccess() throws Exception {
            // given
            AuthRequestDto.Signup request = createSignupRequest();
            AuthResponseDto.Signup response = AuthResponseDto.Signup.builder()
                    .userId(1L)
                    .email("test@test.com")
                    .name("테스트")
                    .role(Role.OWNER)
                    .build();

            given(authService.signup(any())).willReturn(response);

            // when & then
            mockMvc.perform(post("/api/v1/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.userId").value(1))
                    .andExpect(jsonPath("$.data.email").value("test@test.com"));

            verify(authService).signup(any());
        }

        @Test
        @DisplayName("실패: 유효성 검사 실패 시 400을 반환한다")
        void signupValidationFail() throws Exception {
            // given - 이메일 누락
            AuthRequestDto.Signup request = new AuthRequestDto.Signup();
            ReflectionTestUtils.setField(request, "password", "Test1234!");
            ReflectionTestUtils.setField(request, "name", "테스트");
            ReflectionTestUtils.setField(request, "role", Role.OWNER);

            // when & then
            mockMvc.perform(post("/api/v1/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("G002"));
        }

        @Test
        @DisplayName("실패: 숫자만 비밀번호면 400을 반환한다")
        void signupPasswordNumericOnlyValidationFail() throws Exception {
            // given
            AuthRequestDto.Signup request = createSignupRequest();
            ReflectionTestUtils.setField(request, "password", "12345678");

            // when & then
            mockMvc.perform(post("/api/v1/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("G002"));
        }

        @Test
        @DisplayName("실패: 72자 초과 비밀번호면 400을 반환한다")
        void signupPasswordTooLongValidationFail() throws Exception {
            // given
            AuthRequestDto.Signup request = createSignupRequest();
            String longPassword = "Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!Aa1!";
            ReflectionTestUtils.setField(request, "password", longPassword);

            // when & then
            mockMvc.perform(post("/api/v1/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("G002"));
        }

        @Test
        @DisplayName("실패: 이메일 중복 시 409를 반환한다")
        void signupDuplicateEmail() throws Exception {
            // given
            AuthRequestDto.Signup request = createSignupRequest();
            given(authService.signup(any())).willThrow(new BusinessException(ErrorCode.DUPLICATE_EMAIL));

            // when & then
            mockMvc.perform(post("/api/v1/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status").value("U002"));
        }
    }

    @Nested
    @DisplayName("로그인 API 테스트")
    class LoginTest {

        @Test
        @DisplayName("성공: 올바른 자격증명으로 로그인한다")
        void loginSuccess() throws Exception {
            // given
            AuthRequestDto.Login request = createLoginRequest();
            AuthResponseDto.Login response = AuthResponseDto.Login.builder()
                    .userId(1L)
                    .email("test@test.com")
                    .name("테스트")
                    .role(Role.OWNER)
                    .accessToken("access-token")
                    .refreshToken("refresh-token")
                    .build();

            given(authService.login(any())).willReturn(response);

            // when & then
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                    .andExpect(jsonPath("$.data.refreshToken").doesNotExist());

            verify(cookieProvider).addCookie(any(), eq("refresh-token"));
        }

        @Test
        @DisplayName("실패: 잘못된 자격증명 시 401을 반환한다")
        void loginInvalidCredentials() throws Exception {
            // given
            AuthRequestDto.Login request = createLoginRequest();
            given(authService.login(any())).willThrow(new BusinessException(ErrorCode.INVALID_CREDENTIALS));

            // when & then
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value("A101"));
        }

        @Test
        @DisplayName("실패: 탈퇴한 유저 로그인 시 403을 반환한다")
        void loginWithdrawnUser() throws Exception {
            // given
            AuthRequestDto.Login request = createLoginRequest();
            given(authService.login(any())).willThrow(new BusinessException(ErrorCode.WITHDRAWN_USER));

            // when & then
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("A102"));
        }
    }

    @Nested
    @DisplayName("이메일 중복 체크 API 테스트")
    class CheckEmailTest {

        @Test
        @DisplayName("존재하는 이메일을 확인한다")
        void checkEmailExists() throws Exception {
            // given
            given(authService.emailCheck("test@test.com"))
                    .willReturn(AuthResponseDto.EmailCheck.builder().exists(true).build());

            // when & then
            mockMvc.perform(get("/api/v1/auth/check-email")
                            .param("email", "test@test.com"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.exists").value(true));
        }

        @Test
        @DisplayName("존재하지 않는 이메일을 확인한다")
        void checkEmailNotExists() throws Exception {
            // given
            given(authService.emailCheck("new@test.com"))
                    .willReturn(AuthResponseDto.EmailCheck.builder().exists(false).build());

            // when & then
            mockMvc.perform(get("/api/v1/auth/check-email")
                            .param("email", "new@test.com"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.exists").value(false));
        }
    }

    @Nested
    @DisplayName("토큰 재발급 API 테스트")
    class ReissueTest {

        @Test
        @DisplayName("성공: 유효한 리프레시 토큰으로 재발급한다")
        void reissueSuccess() throws Exception {
            // given
            Cookie rtCookie = new Cookie("refresh_token", "old-rt");
            TokenService.TokenPair tokenPair = new TokenService.TokenPair("new-at", "new-rt");

            given(authService.reissueTokens("old-rt")).willReturn(tokenPair);

            // when & then
            mockMvc.perform(post("/api/v1/auth/reissue")
                            .cookie(rtCookie))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.accessToken").value("new-at"));

            verify(cookieProvider).addCookie(any(), eq("new-rt"));
        }

        @Test
        @DisplayName("실패: 리프레시 토큰 쿠키가 없으면 401을 반환한다")
        void reissueNoCookie() throws Exception {
            // given
            given(authService.reissueTokens(null))
                    .willThrow(new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED));

            // when & then
            mockMvc.perform(post("/api/v1/auth/reissue"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value("A106"));
        }
    }

    @Nested
    @DisplayName("로그아웃 API 테스트")
    class LogoutTest {

        @Test
        @DisplayName("성공: 로그아웃 후 쿠키를 삭제한다")
        void logoutSuccess() throws Exception {
            // given
            given(cookieProvider.extractAccessToken(any())).willReturn("access-token");
            doNothing().when(authService).logout("access-token");

            // when & then
            mockMvc.perform(post("/api/v1/auth/logout")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer access-token"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"));

            verify(authService).logout("access-token");
            verify(cookieProvider).clearCookie(any());
        }
    }

    @Nested
    @DisplayName("회원 탈퇴 API 테스트")
    class WithdrawTest {

        @Test
        @DisplayName("성공: 비밀번호 확인 후 탈퇴한다")
        void withdrawSuccess() throws Exception {
            // given
            AuthRequestDto.Withdraw request = new AuthRequestDto.Withdraw();
            ReflectionTestUtils.setField(request, "password", "Test1234!");

            given(cookieProvider.extractAccessToken(any())).willReturn("access-token");
            doNothing().when(authService).withdraw(eq("access-token"), any());

            // when & then
            mockMvc.perform(delete("/api/v1/auth/withdraw")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer access-token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"));

            verify(authService).withdraw(eq("access-token"), any());
            verify(cookieProvider).clearCookie(any());
        }

        @Test
        @DisplayName("실패: 비밀번호 불일치 시 401을 반환한다")
        void withdrawWrongPassword() throws Exception {
            // given
            AuthRequestDto.Withdraw request = new AuthRequestDto.Withdraw();
            ReflectionTestUtils.setField(request, "password", "WrongPass1!");

            given(cookieProvider.extractAccessToken(any())).willReturn("access-token");
            doThrow(new BusinessException(ErrorCode.INVALID_CREDENTIALS))
                    .when(authService).withdraw(eq("access-token"), any());

            // when & then
            mockMvc.perform(delete("/api/v1/auth/withdraw")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer access-token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value("A101"));
        }
    }
}
