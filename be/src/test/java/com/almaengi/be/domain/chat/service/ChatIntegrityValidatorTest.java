package com.almaengi.be.domain.chat.service;

import com.almaengi.be.domain.chat.repository.ChatMessageRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatIntegrityValidator 단위 테스트")
class ChatIntegrityValidatorTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private ChatIntegrityValidator chatIntegrityValidator;

    @Nested
    @DisplayName("lastMessage 정합성 검증")
    class ValidateLastMessageBelongsToRoomTest {

        @Test
        @DisplayName("성공: lastMessageId가 null이면 검증 스킵")
        void successWhenLastMessageIdIsNull() {
            chatIntegrityValidator.validateLastMessageBelongsToRoom(10L, null);
        }

        @Test
        @DisplayName("실패: 메시지가 존재하지 않으면 CHAT_MESSAGE_NOT_FOUND")
        void failWhenMessageNotFound() {
            Long roomId = 10L;
            Long messageId = 100L;

            when(chatMessageRepository.existsById(messageId)).thenReturn(false);

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatIntegrityValidator.validateLastMessageBelongsToRoom(roomId, messageId));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_MESSAGE_NOT_FOUND);
        }

        @Test
        @DisplayName("실패: 메시지 room 불일치면 CHAT_MESSAGE_ROOM_MISMATCH")
        void failWhenMessageRoomMismatch() {
            Long roomId = 10L;
            Long messageId = 100L;

            when(chatMessageRepository.existsById(messageId)).thenReturn(true);
            when(chatMessageRepository.existsByIdAndRoomId(messageId, roomId)).thenReturn(false);

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatIntegrityValidator.validateLastMessageBelongsToRoom(roomId, messageId));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_MESSAGE_ROOM_MISMATCH);
        }

        @Test
        @DisplayName("성공: 메시지가 같은 room에 속하면 통과")
        void successWhenMessageBelongsToRoom() {
            Long roomId = 10L;
            Long messageId = 100L;

            when(chatMessageRepository.existsById(messageId)).thenReturn(true);
            when(chatMessageRepository.existsByIdAndRoomId(messageId, roomId)).thenReturn(true);

            chatIntegrityValidator.validateLastMessageBelongsToRoom(roomId, messageId);
        }
    }

    @Nested
    @DisplayName("lastRead 정합성 검증")
    class ValidateLastReadBelongsToRoomTest {

        @Test
        @DisplayName("성공: lastReadMessageId가 null이면 검증 스킵")
        void successWhenLastReadMessageIdIsNull() {
            chatIntegrityValidator.validateLastReadBelongsToRoom(20L, null);
        }

        @Test
        @DisplayName("실패: 메시지가 존재하지 않으면 CHAT_MESSAGE_NOT_FOUND")
        void failWhenMessageNotFound() {
            Long roomId = 20L;
            Long messageId = 200L;

            when(chatMessageRepository.existsById(messageId)).thenReturn(false);

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatIntegrityValidator.validateLastReadBelongsToRoom(roomId, messageId));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_MESSAGE_NOT_FOUND);
        }

        @Test
        @DisplayName("실패: 메시지 room 불일치면 CHAT_MESSAGE_ROOM_MISMATCH")
        void failWhenMessageRoomMismatch() {
            Long roomId = 20L;
            Long messageId = 200L;

            when(chatMessageRepository.existsById(messageId)).thenReturn(true);
            when(chatMessageRepository.existsByIdAndRoomId(messageId, roomId)).thenReturn(false);

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatIntegrityValidator.validateLastReadBelongsToRoom(roomId, messageId));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_MESSAGE_ROOM_MISMATCH);
        }

        @Test
        @DisplayName("성공: 메시지가 같은 room에 속하면 통과")
        void successWhenMessageBelongsToRoom() {
            Long roomId = 20L;
            Long messageId = 200L;

            when(chatMessageRepository.existsById(messageId)).thenReturn(true);
            when(chatMessageRepository.existsByIdAndRoomId(messageId, roomId)).thenReturn(true);

            chatIntegrityValidator.validateLastReadBelongsToRoom(roomId, messageId);
        }
    }

    @Nested
    @DisplayName("DM pair 정규화")
    class NormalizeDmPairTest {

        @Test
        @DisplayName("성공: 작은 userId가 userA, 큰 userId가 userB")
        void successNormalizeOrder() {
            ChatIntegrityValidator.DmPair pair = chatIntegrityValidator.normalizeDmPair(50L, 10L);

            assertThat(pair.userA()).isEqualTo(10L);
            assertThat(pair.userB()).isEqualTo(50L);
        }

        @Test
        @DisplayName("실패: userA가 null이면 CHAT_INVALID_DM_PAIR")
        void failWhenUserAIsNull() {
            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatIntegrityValidator.normalizeDmPair(null, 10L));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_INVALID_DM_PAIR);
        }

        @Test
        @DisplayName("실패: 자기 자신과 DM이면 CHAT_INVALID_DM_PAIR")
        void failWhenSameUser() {
            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatIntegrityValidator.normalizeDmPair(10L, 10L));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_INVALID_DM_PAIR);
        }
    }
}
