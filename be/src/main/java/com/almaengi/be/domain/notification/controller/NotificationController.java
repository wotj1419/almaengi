package com.almaengi.be.domain.notification.controller;

import com.almaengi.be.domain.notification.dto.FcmRequestDto;
import com.almaengi.be.domain.notification.dto.FcmResponseDto;
import com.almaengi.be.domain.notification.service.FcmService;
import com.almaengi.be.domain.notification.service.NotificationService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final FcmService fcmService;
    private final NotificationService notificationService;

    // 클라이언트 디바이스 토큰(FCM) 서버 등록/갱신 API
    @PostMapping("/token")
    public ApiResponse<String> registerFcmToken(@AuthUser Long userId, @RequestBody FcmRequestDto.TokenRegister request) {
        notificationService.registerFcmToken(userId, request.getDeviceToken());
        return ApiResponse.success("FCM 디바이스 토큰 저장이 성공적으로 완료되었습니다.");
    }

    // 내 알림함 목록 조회
    @GetMapping
    public ApiResponse<List<FcmResponseDto.NotificationDto>> getMyNotifications(@AuthUser Long userId) {
        List<FcmResponseDto.NotificationDto> response = notificationService.getNotificationHistory(userId);
        return ApiResponse.success(response);
    }

    // 특정 알림 단건 읽음 처리
    @PatchMapping("/{notificationId}/read")
    public ApiResponse<String> markAsRead(@AuthUser Long userId, @PathVariable Long notificationId) {
        notificationService.readNotification(userId, notificationId);
        return ApiResponse.success("알림 읽음 처리");
    }

    @PatchMapping("/reads")
    public ApiResponse<String> markAsReads(@AuthUser Long userId, @RequestBody FcmRequestDto.NotificationRead request) {
        notificationService.readNotifications(userId, request.getNotificationIds());
        return ApiResponse.success("알림 읽음 처리");
    }
}
