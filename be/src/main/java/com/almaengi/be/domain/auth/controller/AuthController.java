package com.almaengi.be.domain.auth.controller;

import com.almaengi.be.domain.auth.dto.AuthRequestDto;
import com.almaengi.be.domain.auth.dto.AuthResponseDto;
import com.almaengi.be.domain.auth.service.AuthService;
import com.almaengi.be.domain.auth.service.TokenService;
import com.almaengi.be.global.common.ApiResponse;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.security.jwt.JwtProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;
    private final JwtProvider jwtProvider;

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    private static final String RT_COOKIE_NAME = "refresh_token";
    private static final String RT_COOKIE_PATH = "/api/v1/auth";

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponseDto.Signup>> signup(@Valid @RequestBody AuthRequestDto.Signup request) {
        AuthResponseDto.Signup response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDto.Login>> login(@Valid @RequestBody AuthRequestDto.Login request, HttpServletResponse httpResponse) {

        AuthResponseDto.Login response = authService.login(request);

        addRefreshTokenCookie(httpResponse, response.getRefreshToken());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 이메일 중복 체크
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<AuthResponseDto.EmailCheck>> emailCheck(@RequestParam String email) {
        AuthResponseDto.EmailCheck response = authService.emailCheck(email);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 토큰 재발급
    @PostMapping("/reissue")
    public ResponseEntity<ApiResponse<AuthResponseDto.Token>> reissue(@CookieValue(name = RT_COOKIE_NAME, required = false) String refreshToken, HttpServletResponse httpResponse) {
        if (refreshToken == null) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        TokenService.TokenPair tokenPair = tokenService.reissue(refreshToken);

        addRefreshTokenCookie(httpResponse, tokenPair.refreshToken());

        AuthResponseDto.Token response = AuthResponseDto.Token.builder()
                .accessToken(tokenPair.accessToken())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request, HttpServletResponse httpResponse) {
        String accessToken = extractToken(request);
        authService.logout(accessToken);

        clearRefreshTokenCookie(httpResponse);

        return ResponseEntity.ok(ApiResponse.success());
    }

    // 회원 탈퇴
    @DeleteMapping("/withdraw")
    public ResponseEntity<ApiResponse<Void>> withdraw(HttpServletRequest request, HttpServletResponse httpResponse, @RequestBody(required = false) AuthRequestDto.Withdraw withdrawRequest) {
        String accessToken = extractToken(request);
        authService.withdraw(accessToken, withdrawRequest);

        clearRefreshTokenCookie(httpResponse);

        return ResponseEntity.ok(ApiResponse.success());
    }

    // Private Helper Methods
    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        long maxAgeSeconds = jwtProvider.getRefreshTokenExpiry() / 1000;

        ResponseCookie cookie = ResponseCookie.from(RT_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path(RT_COOKIE_PATH)
                .maxAge(maxAgeSeconds)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(RT_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path(RT_COOKIE_PATH)
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }

        return null;
    }

}
