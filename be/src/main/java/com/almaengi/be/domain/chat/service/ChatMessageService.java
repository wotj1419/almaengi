package com.almaengi.be.domain.chat.service;

import com.almaengi.be.domain.chat.ChatBotProperties;
import com.almaengi.be.domain.chat.dto.ChatMessageRequestDto;
import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.almaengi.be.domain.chat.entity.ChatMessage;
import com.almaengi.be.domain.chat.entity.ChatRoom;
import com.almaengi.be.domain.chat.entity.ChatRoomMember;
import com.almaengi.be.domain.chat.repository.ChatMessageRepository;
import com.almaengi.be.domain.chat.repository.ChatRoomMemberRepository;
import com.almaengi.be.domain.chat.repository.ChatRoomRepository;
import com.almaengi.be.domain.chat.type.ChatMessageType;
import com.almaengi.be.domain.chat.type.ChatRoomType;
import com.almaengi.be.domain.chat.ws.pubsub.ChatRedisPublisher;
import com.almaengi.be.domain.notification.service.NotificationService;
import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatMessageService {
    private static final int MAX_PAGE_SIZE = 100;

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ChatBotProperties chatBotProperties;
    private final ChatBotAsyncService chatBotAsyncService;
    private final ChatIntegrityValidator chatIntegrityValidator;

    private final NotificationService notificationService;

    // DM/GROUP/BOT 공통 실시간 전파를 위한 Redis publisher
    private final ChatRedisPublisher chatRedisPublisher;

    /**
     * 메세지 전송
     * - 활성 멤버인지 검증
     * - TEXT 메시지 저장
     * - room.last_message_ 갱신
     */
    @Transactional
    public ChatMessageResponseDto.MessageItem sendMessage(Long userId, Long roomId, ChatMessageRequestDto.SendMessage request) {
        ChatRoom room = getRoomOrThrow(roomId);
        ensureActiveMember(roomId, userId);

        // 추후 TEXT 메세지가 아닌 file 전송 등도 처리하도록 해야함.
        // 일단은 MVP로 TEXT 메세지만 전송되도록.
        if(request.getMessageType() != ChatMessageType.TEXT) throw new BusinessException(ErrorCode.CHAT_INVALID_REFERENCE);

        User sender = getUserOrThrow(userId);

        ChatMessage message = ChatMessage.createText(room, sender, request.getContent());
        ChatMessage saved = chatMessageRepository.save(message);

        // 메세지 저장과 같은 transaction 에서 room 포인터 갱신 (정합성이 핵심)
        room.updateLastMessagePointer(saved.getId(), saved.getSentAt());
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                // 1) 실시간 WS fan-out 이벤트 발행
                // - REST 전송(DM/GROUP)도 BOT과 동일하게 publish 되도록 통일
                try {
                    ChatMessageResponseDto.MessageItem payload = ChatMessageResponseDto.MessageItem.from(saved);
                    chatRedisPublisher.publishMessageCreated(roomId, payload);
                } catch (Exception e) {
                    // 실시간 발행 실패가 메시지 저장 성공을 깨지 않도록 best-effort
                    log.warn("[CHAT] redis publish failed. roomId={}, messageId={}, reason={}",
                            roomId, saved.getId(), e.getMessage());
                }

                notifyChatPushOnly(room, sender, saved);
            }
        });

        // BOT 방이면 챗봇 응답 생성.
        // - sender.role 기반으로 OWNER/EMPLOYEE 전달
        // - role이 비어있으면 안전하게 OWNER 기본값 사용
        if(room.getRoomType() == ChatRoomType.BOT && !userId.equals(chatBotProperties.getBotUserId())) {
            String requesterRole = (sender.getRole() != null) ? sender.getRole().name() : "OWNER";
            chatBotAsyncService.generateAndSaveBotReply(room.getStore().getId(), room.getId(), userId, saved.getId(), request.getContent(), requesterRole);
        }

        return ChatMessageResponseDto.MessageItem.from(saved);
    }

    /**
     * 커서 기반 메세지 조회
     * - cursor가 없으면 최신부터 size 만큼
     * - cursor가 있으면 id < cursor 범위에서 size만큼
     * - 결과 정렬은 repository 쿼리 (id DESC) 그대로 보장
     */
    public ChatMessageResponseDto.MessagePage getMessages(Long userId, Long roomId, Long cursor, Integer size) {
        getRoomOrThrow(roomId);
        ensureActiveMember(roomId, userId);

        if(cursor != null && cursor <= 0)
            throw new BusinessException(ErrorCode.CHAT_INVALID_CURSOR);

        int pageSize = normalizePageSize(size); // 메시지 조회 개수 30 ~ 100개 사이로 정규화
        List<ChatMessage> messages = chatMessageRepository.findPageByRoomIdWithCursor(roomId, cursor, PageRequest.of(0, pageSize));
        List<ChatMessageResponseDto.MessageItem> items = messages.stream()
                .map(ChatMessageResponseDto.MessageItem::from)
                .toList();

        Long nextCursor = (messages.size() == pageSize && !messages.isEmpty())
                ? messages.get(messages.size() -1).getId()
                : null;

        return ChatMessageResponseDto.MessagePage.of(items, nextCursor, pageSize);
    }

    @Transactional
    public void markAsRead(Long userId, Long roomId, ChatMessageRequestDto.MarkRead request) {
        getRoomOrThrow(roomId);
        ChatRoomMember member = getActiveMemberOrThrow(roomId, userId);

        // 같은 채팅방의 메세지인지 검증
        Long lastReadMessageId = request.getLastReadMessageId();
        chatIntegrityValidator.validateLastReadBelongsToRoom(roomId, lastReadMessageId);

        // 읽음 포인터 역행 방지: 이미 더 뒤의 메세지를 읽은 상태라면 에러
        Long currentLastRead = member.getLastReadMessageId();
        if(currentLastRead != null && lastReadMessageId < currentLastRead)
            throw new BusinessException(ErrorCode.CHAT_INVALID_REFERENCE);

        member.updateLastRead(lastReadMessageId, null);
    }


    // ======================================================================================
    // private helper method
    // ======================================================================================
    private int normalizePageSize(Integer size) {
        if (size == null || size <= 0) {
            return 30;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }
    private ChatRoom getRoomOrThrow(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));
    }
    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
    private void ensureActiveMember(Long roomId, Long userId) {
        if (!chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)) {
            throw new BusinessException(ErrorCode.CHAT_MEMBER_NOT_ACTIVE);
        }
    }
    private ChatRoomMember getActiveMemberOrThrow(Long roomId, Long userId) {
        return chatRoomMemberRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_MEMBER_NOT_ACTIVE));
    }

    private void notifyChatPushOnly(ChatRoom room, User sender, ChatMessage savedMessage) {
        try {
            Long botUserId = chatBotProperties.getBotUserId();
            List<ChatRoomMember> activeMembers = chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(room.getId());

            String roomName = (room.getName() != null && !room.getName().isBlank()) ? room.getName() : "채팅방";
            String title = "[" + roomName + "] 새 메시지";
            String body = buildPushBody(sender.getName(), savedMessage.getContent());

            for(ChatRoomMember member : activeMembers) {
                Long receiverId = member.getUser().getId();
                // 송신자 제외
                if(receiverId.equals(sender.getId())) continue;
                // 봇 제외
                if (botUserId != null && receiverId.equals(botUserId)) continue;

                notificationService.sendPushOnly(member.getUser(), title, body, NotificationType.CHAT.name(), String.valueOf(room.getId()));
            }
        } catch(Exception e) {
            // push-only 실패가 메시지 저장 성공을 깨지 않도록 best-effort
            log.warn("FCM push-only 송신 실패. roomId={}, senderId={}, reason={}", room.getId(), sender.getId(), e.getMessage(), e);
        }
    }
    private String buildPushBody(String senderName, String content) {
        String safeSender = (senderName == null || senderName.isBlank()) ? "알 수 없음" : senderName;
        String safeContent = (content == null) ? "" : content.replaceAll("\\s+", " ").trim();

        if(safeContent.length() > 80)
            safeContent = safeContent.substring(0, 80) + "...";

        return safeSender +": " + safeContent;
    }
}
