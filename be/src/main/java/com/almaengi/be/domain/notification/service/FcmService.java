package com.almaengi.be.domain.notification.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FcmService {

    // 특정 디바이스로 단일 푸시 알람 전송
    @Async
    public void sendPushNotification(String targetToken, String title, String body, String type, String targetId) {
        // data-only 메시지로 전송:
        // - 백그라운드 알림 표시는 서비스워커(showNotification)에서 단일 처리
        // - notification payload를 넣지 않아 브라우저 자동 표시 중복을 방지
        Message message = Message.builder()
                .setToken(targetToken)
                .putData("title", title != null ? title : "")
                .putData("body", body != null ? body : "")
                .putData("type", type != null ? type : "")
                .putData("targetId", targetId != null ? targetId : "")
                .build();
        try {
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("메세지 전송 성공! Message Id: {}", response);
        } catch (FirebaseMessagingException e) {
            log.warn("메세지 전송 실패: {}", e.getMessage());
        }
    }
}
