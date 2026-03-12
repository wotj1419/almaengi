package com.almaengi.be.domain.notification.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FcmService {

    // 특정 디바이스로 단일 푸시 알람 전송
    @Async
    public void sendPushNotification(String targetToken, String title, String body, String type, String targetId) {
        // 1. 알림 내용(Title, Body) 구성
        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        // 2. 메세지 객체 구성 (토큰 및 알림 내용 포함)
        Message message = Message.builder()
                .setToken(targetToken)
                .setNotification(notification)
                .putData("type", type != null ? type : "")
                .putData("targetId", targetId != null ? targetId : "")
                .build();

        try {
            // 3. Firebase 로 메세지 전송 요청
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("메세지 전송 성공! Message Id: {}", response);
        } catch(FirebaseMessagingException e) {
            log.warn("메세지 전송 실패: {}", e.getMessage());
        }
    }
}
