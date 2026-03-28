package com.almaengi.be.domain.auth.controller;

import com.almaengi.be.domain.auth.controller.docs.AuthControllerDocs;
import com.almaengi.be.domain.auth.dto.AuthRequestDto;
import com.almaengi.be.domain.auth.dto.AuthResponseDto;
import com.almaengi.be.domain.auth.service.AuthService;
import com.almaengi.be.domain.auth.service.TokenService;
import com.almaengi.be.domain.auth.util.RefreshTokenCookieProvider;
import com.almaengi.be.global.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController implements AuthControllerDocs {

    private final AuthService authService;
    private final RefreshTokenCookieProvider cookieProvider;

    // 회원가입
    @Override
    @PostMapping("/signup")
    public ApiResponse<AuthResponseDto.Signup> signup(@Valid @RequestBody AuthRequestDto.Signup request) {
        AuthResponseDto.Signup response = authService.signup(request);
        return ApiResponse.success(response);
    }

    // 로그인
    @Override
    @PostMapping("/login")
    public ApiResponse<AuthResponseDto.Login> login(@Valid @RequestBody AuthRequestDto.Login request, HttpServletResponse httpResponse) {
        AuthResponseDto.Login response = authService.login(request);
        cookieProvider.addCookie(httpResponse, response.getRefreshToken());
        return ApiResponse.success(response);
    }

    // 이메일 중복 체크
    @Override
    @GetMapping("/check-email")
    public ApiResponse<AuthResponseDto.EmailCheck> emailCheck(@RequestParam String email) {
        AuthResponseDto.EmailCheck response = authService.emailCheck(email);
        return ApiResponse.success(response);
    }

    // 토큰 재발급
    @Override
    @PostMapping("/reissue")
    public ApiResponse<AuthResponseDto.Token> reissue(@CookieValue(name = "refresh_token", required = false) String refreshToken, HttpServletResponse httpResponse) {
        TokenService.TokenPair tokenPair = authService.reissueTokens(refreshToken);

        cookieProvider.addCookie(httpResponse, tokenPair.refreshToken());

        AuthResponseDto.Token response = AuthResponseDto.Token.builder()
                .accessToken(tokenPair.accessToken())
                .build();

        return ApiResponse.success(response);
    }

    // 로그아웃
    @Override
    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse httpResponse) {
        String accessToken = cookieProvider.extractAccessToken(request);
        authService.logout(accessToken);
        cookieProvider.clearCookie(httpResponse);
        return ApiResponse.success();
    }

    // 회원 탈퇴
    @Override
    @DeleteMapping("/withdraw")
    public ApiResponse<Void> withdraw(HttpServletRequest request, HttpServletResponse httpResponse, @RequestBody(required = false) AuthRequestDto.Withdraw withdrawRequest) {
        String accessToken = cookieProvider.extractAccessToken(request);
        authService.withdraw(accessToken, withdrawRequest);
        cookieProvider.clearCookie(httpResponse);
        return ApiResponse.success();
    }
}
