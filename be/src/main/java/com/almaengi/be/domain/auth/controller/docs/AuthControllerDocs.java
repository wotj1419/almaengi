package com.almaengi.be.domain.auth.controller.docs;

import com.almaengi.be.domain.auth.dto.AuthRequestDto;
import com.almaengi.be.domain.auth.dto.AuthResponseDto;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "인증 API", description = "회원가입, 로그인, 로그아웃, 탈퇴, 토큰 발급 API")
public interface AuthControllerDocs {

    @Operation(summary = "회원가입", description = "이메일/비밀번호 기반으로 회원가입합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "A102: 이미 사용 중인 이메일입니다.")
    })
    ApiResponse<AuthResponseDto.Signup> signup(
            @RequestBody AuthRequestDto.Signup request
    );

    @Operation(summary = "로그인", description = "이메일/비밀번호로 로그인합니다. 액세스 토큰은 응답 바디, 리프레시 토큰은 HttpOnly 쿠키로 전달됩니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "A101: 이메일 또는 비밀번호가 올바르지 않습니다.")
    })
    ApiResponse<AuthResponseDto.Login> login(
            @RequestBody AuthRequestDto.Login request,
            @Parameter(hidden = true) HttpServletResponse httpResponse
    );

    @Operation(summary = "이메일 중복 체크", description = "해당 이메일이 이미 가입되어 있는지 확인합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공")
    })
    ApiResponse<AuthResponseDto.EmailCheck> emailCheck(
            @Parameter(description = "중복 확인할 이메일", example = "user@example.com") @RequestParam String email
    );

    @Operation(summary = "토큰 재발급", description = "리프레시 토큰 쿠키를 사용하여 새로운 액세스 토큰과 리프레시 토큰을 발급합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "A103: 리프레시 토큰이 만료되었습니다.")
    })
    ApiResponse<AuthResponseDto.Token> reissue(
            @Parameter(hidden = true) @CookieValue(name = "refresh_token", required = false) String refreshToken,
            @Parameter(hidden = true) HttpServletResponse httpResponse
    );

    @Operation(summary = "로그아웃", description = "액세스 토큰을 블랙리스트에 등록하고 리프레시 토큰을 삭제합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공")
    })
    ApiResponse<Void> logout(
            @Parameter(hidden = true) HttpServletRequest request,
            @Parameter(hidden = true) HttpServletResponse httpResponse
    );

    @Operation(summary = "회원 탈퇴", description = "회원 탈퇴를 처리합니다. LOCAL 로그인 유저는 비밀번호 재확인이 필요합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "A101: 이메일 또는 비밀번호가 올바르지 않습니다.")
    })
    ApiResponse<Void> withdraw(
            @Parameter(hidden = true) HttpServletRequest request,
            @Parameter(hidden = true) HttpServletResponse httpResponse,
            @RequestBody(required = false) AuthRequestDto.Withdraw withdrawRequest
    );
}
