package com.almaengi.be.global.security.jwt;

import com.almaengi.be.global.security.redis.RedisTokenRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final RedisTokenRepository redisTokenRepository;

    private static final List<String> PERMIT_URLS = List.of(
            "/api/v1/auth/signup",
            "/api/v1/auth/login",
            "/api/v1/auth/check-email",
            "/api/v1/auth/reissue"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return PERMIT_URLS.stream().anyMatch(path::equals)
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-resources")
                || path.startsWith("/webjars");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && jwtProvider.validateToken(token)) {
            Claims claims = jwtProvider.parseToken(token);

            // type 검증
            String type = jwtProvider.getType(claims);
            if (!"access".equals(type)) {
                filterChain.doFilter(request, response);
                return;
            }

            String jti = jwtProvider.getJti(claims);

            // 블랙리스트 확인
            if (jti != null && redisTokenRepository.isBlacklisted(jti)) {
                request.setAttribute("authErrorCode", "A104");
                request.setAttribute("authErrorMessage", "이미 로그아웃된 토큰입니다.");
                filterChain.doFilter(request, response);
                return;
            }

            // SecurityContext에 인증 정보 설정
            Long userId = jwtProvider.getUserId(claims);
            String role = jwtProvider.getRole(claims);

            List<SimpleGrantedAuthority> authorities = (role != null)
                    ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    : Collections.emptyList();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
