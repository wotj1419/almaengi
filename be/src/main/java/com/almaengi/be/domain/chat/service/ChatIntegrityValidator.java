package com.almaengi.be.domain.chat.service;

import com.almaengi.be.domain.chat.repository.ChatMessageRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatIntegrityValidator {
    private final ChatMessageRepository chatMessageRepository;

    // chat_rooms.last_message_id 정합성 검증:
    //  "해당 room의 메시지인지"를 확인
    public void validateLastMessageBelongsToRoom(Long roomId, Long lastMessageId) {
        if(lastMessageId == null) return;

        if(!chatMessageRepository.existsById(lastMessageId))
            throw new BusinessException(ErrorCode.CHAT_MESSAGE_NOT_FOUND);

        boolean exists = chatMessageRepository.existsByIdAndRoomId(lastMessageId, roomId);
        if(!exists) throw new BusinessException(ErrorCode.CHAT_MESSAGE_ROOM_MISMATCH);
    }

    // chat_room_members.last_read_message_id 정합성 검증:
    //  "해당 room의 메시지인지"를 확인
    public void validateLastReadBelongsToRoom(Long roomId, Long lastReadMessageId) {
        if(lastReadMessageId == null) return;

        if (!chatMessageRepository.existsById(lastReadMessageId)) {
            throw new BusinessException(ErrorCode.CHAT_MESSAGE_NOT_FOUND);
        }

        boolean exists = chatMessageRepository.existsByIdAndRoomId(lastReadMessageId, roomId);
        if(!exists) throw new BusinessException(ErrorCode.CHAT_MESSAGE_ROOM_MISMATCH);
    }

    // DM Pair 정규화
    // 항상 작은 userId가 user1, 큰 userId가 user2가 되도록 통일
    public DmPair normalizeDmPair(Long userA, Long userB) {
        if(userA == null || userB == null || userA.equals(userB))
            throw new BusinessException(ErrorCode.CHAT_INVALID_DM_PAIR);

        long user1 = Math.min(userA, userB);
        long user2 = Math.max(userA, userB);
        return new DmPair(user1, user2);
    }

    public record DmPair(Long userA, Long userB) {}
}
