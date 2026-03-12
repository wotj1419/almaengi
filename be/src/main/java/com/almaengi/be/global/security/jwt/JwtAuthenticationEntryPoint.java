package com.almaengi.be.global.security.jwt;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        String errorCode = (String) request.getAttribute("authErrorCode");
        String errorMessage = (String) request.getAttribute("authErrorMessage");

        if (errorCode == null) {
            errorCode = "A105";
            errorMessage = "유효하지 않은 토큰입니다.";
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
                "{\"status\":\"" + errorCode + "\",\"message\":\"" + errorMessage + "\",\"data\":null}");
    }
}
