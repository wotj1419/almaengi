package com.almaengi.be.global.common;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ApiResponse<T> {
    private String status;
    private String message;
    private T data;

    // 성공 응답 (데이터가 있는 경우)
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("SUCCESS", "요청이 성공적으로 처리되었습니다.", data);
    }

    // 성공 응답 (데이터가 없는 경우)
    public static ApiResponse<Void> success() {
        return new ApiResponse<>("SUCCESS", "요청이 성공적으로 처리되었습니다.", null);
    }

    // 에러 응답
    public static <T> ApiResponse<T> error(String status, String message) {
        return new ApiResponse<>(status, message, null);
    }
}
