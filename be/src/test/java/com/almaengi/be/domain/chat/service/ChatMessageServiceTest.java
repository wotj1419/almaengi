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
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatMessageService Step4 단위 테스트")
class ChatMessageServiceTest {
    @InjectMocks
    private ChatMessageService chatMessageService;
    @Mock
    private ChatRoomRepository chatRoomRepository;
    @Mock
    private ChatRoomMemberRepository chatRoomMemberRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ChatBotProperties chatBotProperties;
    @Mock
    private ChatBotAsyncService chatBotAsyncService;
    @Mock
    private ChatIntegrityValidator chatIntegrityValidator;

    @Mock
    private ChatRedisPublisher chatRedisPublisher;

    @Nested
    @DisplayName("메시지 전송")
    class SendMessageTest {
        @Test
        @DisplayName("성공: TEXT 메시지 저장 + room 포인터 갱신")
        void sendMessage_success() {
            Long roomId = 100L;
            Long userId = 10L;
            User sender = user(userId, "사장");
            Store store = store(1L, sender);
            ChatRoom room = room(roomId, store, sender, ChatRoomType.GROUP);
            ChatMessageRequestDto.SendMessage request = new ChatMessageRequestDto.SendMessage();
            ReflectionTestUtils.setField(request, "messageType", ChatMessageType.TEXT);
            ReflectionTestUtils.setField(request, "content", "전달사항입니다.");
            ChatMessage saved = ChatMessage.createText(room, sender, "전달사항입니다.");
            ReflectionTestUtils.setField(saved, "id", 500L);
            ReflectionTestUtils.setField(saved, "sentAt", LocalDateTime.of(2026, 3, 22, 11, 0));
            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)).willReturn(true);
            given(userRepository.findById(userId)).willReturn(Optional.of(sender));
            given(chatMessageRepository.save(any(ChatMessage.class))).willReturn(saved);

            TransactionSynchronizationManager.initSynchronization();
            ChatMessageResponseDto.MessageItem result;
            try {
                result = chatMessageService.sendMessage(userId, roomId, request);

                for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
                    synchronization.afterCommit();
                }
                verify(chatRedisPublisher, times(1)).publishMessageCreated(eq(roomId), any(ChatMessageResponseDto.MessageItem.class));
            } finally {
                TransactionSynchronizationManager.clearSynchronization();
            }

            assertThat(result.getMessageId()).isEqualTo(500L);
            assertThat(result.getContent()).isEqualTo("전달사항입니다.");
            // 일반 채팅은 AI 메타가 비어있어야 함
            assertThat(result.getAnswer()).isNull();
            assertThat(result.getSources()).isEmpty();
            assertThat(result.getIntent()).isNull();
            assertThat(room.getLastMessageId()).isEqualTo(500L);
            assertThat(room.getLastMessageAt()).isEqualTo(LocalDateTime.of(2026, 3, 22, 11, 0));
            verify(chatMessageRepository, times(1)).save(any(ChatMessage.class));
            verify(chatBotAsyncService, never()).generateAndSaveBotReply(anyLong(), anyLong(), anyLong(), anyLong(), anyString(), anyString());
        }
        @Test
        @DisplayName("실패: TEXT 외 타입은 CHAT_INVALID_REFERENCE")
        void sendMessage_failWhenNotTextType() {
            Long roomId = 100L;
            Long userId = 10L;
            User sender = user(userId, "사장");
            Store store = store(1L, sender);
            ChatRoom room = room(roomId, store, sender, ChatRoomType.GROUP);
            ChatMessageRequestDto.SendMessage request = new ChatMessageRequestDto.SendMessage();
            ReflectionTestUtils.setField(request, "messageType", ChatMessageType.FILE);
            ReflectionTestUtils.setField(request, "content", "file");
            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)).willReturn(true);

            TransactionSynchronizationManager.initSynchronization();
            BusinessException e;
            try {
                e = assertThrows(BusinessException.class,
                        () -> chatMessageService.sendMessage(userId, roomId, request));
            } finally {
                TransactionSynchronizationManager.clearSynchronization();
            }

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_INVALID_REFERENCE);
        }
        @Test
        @DisplayName("성공: BOT 방에서 일반 사용자가 보내면 비동기 응답 트리거")
        void sendMessage_botRoomTriggersAsync() {
            Long roomId = 200L;
            Long userId = 10L;
            Long botUserId = 999L;
            User sender = user(userId, "직원");
            User owner = user(1L, "사장");
            Store store = store(1L, owner);
            ChatRoom botRoom = room(roomId, store, owner, ChatRoomType.BOT);
            ChatMessageRequestDto.SendMessage request = new ChatMessageRequestDto.SendMessage();
            ReflectionTestUtils.setField(request, "messageType", ChatMessageType.TEXT);
            ReflectionTestUtils.setField(request, "content", "재고 질문");
            ChatMessage saved = ChatMessage.createText(botRoom, sender, "재고 질문");
            ReflectionTestUtils.setField(saved, "id", 701L);
            ReflectionTestUtils.setField(saved, "sentAt", LocalDateTime.of(2026, 3, 22, 11, 30));
            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(botRoom));
            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)).willReturn(true);
            given(userRepository.findById(userId)).willReturn(Optional.of(sender));
            given(chatMessageRepository.save(any(ChatMessage.class))).willReturn(saved);
            given(chatBotProperties.getBotUserId()).willReturn(botUserId);

            // 역할 전달 검증을 위해 sender role 세팅
            ReflectionTestUtils.setField(sender, "role", Role.EMPLOYEE);

            TransactionSynchronizationManager.initSynchronization();
            try {
                chatMessageService.sendMessage(userId, roomId, request);
            } finally {
                TransactionSynchronizationManager.clearSynchronization();
            }

            verify(chatBotAsyncService, times(1))
                    .generateAndSaveBotReply(store.getId(), roomId, userId, 701L, "재고 질문", "EMPLOYEE");
        }

        @Test
        @DisplayName("성공: BOT 방에서 sender.role이 null이면 OWNER 기본값으로 비동기 호출")
        void sendMessage_botRoomTriggersAsyncWithDefaultOwnerRole() {
            Long roomId = 201L;
            Long userId = 10L;
            Long botUserId = 999L;

            User sender = user(userId, "직원");
            User owner = user(1L, "사장");
            Store store = store(1L, owner);
            ChatRoom botRoom = room(roomId, store, owner, ChatRoomType.BOT);

            ChatMessageRequestDto.SendMessage request = new ChatMessageRequestDto.SendMessage();
            ReflectionTestUtils.setField(request, "messageType", ChatMessageType.TEXT);
            ReflectionTestUtils.setField(request, "content", "질문합니다");

            ChatMessage saved = ChatMessage.createText(botRoom, sender, "질문합니다");
            ReflectionTestUtils.setField(saved, "id", 702L);
            ReflectionTestUtils.setField(saved, "sentAt", LocalDateTime.of(2026, 3, 22, 11, 31));

            // sender.role은 null 상태를 유지
            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(botRoom));
            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)).willReturn(true);
            given(userRepository.findById(userId)).willReturn(Optional.of(sender));
            given(chatMessageRepository.save(any(ChatMessage.class))).willReturn(saved);
            given(chatBotProperties.getBotUserId()).willReturn(botUserId);

            TransactionSynchronizationManager.initSynchronization();
            try {
                chatMessageService.sendMessage(userId, roomId, request);
            } finally {
                TransactionSynchronizationManager.clearSynchronization();
            }

            verify(chatBotAsyncService, times(1))
                    .generateAndSaveBotReply(store.getId(), roomId, userId, 702L, "질문합니다", "OWNER");
        }
    }
    @Nested
    @DisplayName("메시지 조회")
    class GetMessagesTest {
        @Test
        @DisplayName("성공: cursor 기반 조회 + nextCursor 계산")
        void getMessages_success() {
            Long roomId = 100L;
            Long userId = 10L;
            User sender = user(userId, "사장");
            Store store = store(1L, sender);
            ChatRoom room = room(roomId, store, sender, ChatRoomType.GROUP);
            ChatMessage m1 = ChatMessage.createText(room, sender, "m1");
            ReflectionTestUtils.setField(m1, "id", 1200L);
            ChatMessage m2 = ChatMessage.createText(room, sender, "m2");
            ReflectionTestUtils.setField(m2, "id", 1199L);
            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)).willReturn(true);
            given(chatMessageRepository.findPageByRoomIdWithCursor(eq(roomId), eq(null), any(Pageable.class)))
                    .willReturn(List.of(m1, m2));
            ChatMessageResponseDto.MessagePage result = chatMessageService.getMessages(userId, roomId, null, 2);
            assertThat(result.getMessages()).hasSize(2);
            assertThat(result.getNextCursor()).isEqualTo(1199L);
            assertThat(result.getSize()).isEqualTo(2);

            // 일반 메시지는 AI 응답 필드가 비어야 함
            assertThat(result.getMessages().get(0).getAnswer()).isNull();
            assertThat(result.getMessages().get(0).getSources()).isEmpty();
            assertThat(result.getMessages().get(0).getIntent()).isNull();
        }

        @Test
        @DisplayName("성공: BOT 메시지 조회 시 meta_json의 answer/sources/intent가 노출된다")
        void getMessages_botMessageIncludesAiFields() {
            Long roomId = 300L;
            Long userId = 10L;

            User owner = user(userId, "사장");
            User botUser = user(999L, "알맹이봇");
            Store store = store(1L, owner);
            ChatRoom botRoom = room(roomId, store, owner, ChatRoomType.BOT);

            String metaJson = "{\"answer\":\"주휴수당은 ...\",\"sources\":[\"근로기준법 제55조\",\"근로기준법 제18조\"],\"intent\":\"LEGAL_QUERY\"}";

            ChatMessage botMessage = ChatMessage.createBotText(botRoom, botUser, "주휴수당은 ...", metaJson);
            ReflectionTestUtils.setField(botMessage, "id", 1300L);

            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(botRoom));
            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)).willReturn(true);
            given(chatMessageRepository.findPageByRoomIdWithCursor(eq(roomId), eq(null), any(Pageable.class)))
                    .willReturn(List.of(botMessage));

            ChatMessageResponseDto.MessagePage result = chatMessageService.getMessages(userId, roomId, null, 30);

            assertThat(result.getMessages()).hasSize(1);
            ChatMessageResponseDto.MessageItem item = result.getMessages().get(0);
            assertThat(item.getContent()).isEqualTo("주휴수당은 ...");
            assertThat(item.getAnswer()).isEqualTo("주휴수당은 ...");
            assertThat(item.getSources()).containsExactly("근로기준법 제55조", "근로기준법 제18조");
            assertThat(item.getIntent()).isEqualTo("LEGAL_QUERY");
        }
        @Test
        @DisplayName("실패: cursor가 0 이하이면 CHAT_INVALID_CURSOR")
        void getMessages_failInvalidCursor() {
            Long roomId = 100L;
            Long userId = 10L;
            User sender = user(userId, "사장");
            Store store = store(1L, sender);
            ChatRoom room = room(roomId, store, sender, ChatRoomType.GROUP);
            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)).willReturn(true);
            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatMessageService.getMessages(userId, roomId, 0L, 30));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_INVALID_CURSOR);
        }
        @Test
        @DisplayName("정규화: size가 null/음수면 30, 100 초과면 100")
        void getMessages_normalizePageSize() {
            Long roomId = 100L;
            Long userId = 10L;
            User sender = user(userId, "사장");
            Store store = store(1L, sender);
            ChatRoom room = room(roomId, store, sender, ChatRoomType.GROUP);
            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)).willReturn(true);
            given(chatMessageRepository.findPageByRoomIdWithCursor(eq(roomId), eq(null), any(Pageable.class)))
                    .willReturn(List.of());
            // size = null 케이스
            chatMessageService.getMessages(userId, roomId, null, null);
            ArgumentCaptor<Pageable> captor1 = ArgumentCaptor.forClass(Pageable.class);
            verify(chatMessageRepository).findPageByRoomIdWithCursor(eq(roomId), eq(null), captor1.capture());
            assertThat(captor1.getValue().getPageSize()).isEqualTo(30);
            // size = 1000 케이스
            chatMessageService.getMessages(userId, roomId, null, 1000);
            ArgumentCaptor<Pageable> captor2 = ArgumentCaptor.forClass(Pageable.class);
            verify(chatMessageRepository, times(2)).findPageByRoomIdWithCursor(eq(roomId), eq(null), captor2.capture());
            assertThat(captor2.getValue().getPageSize()).isEqualTo(100);
        }
    }

    @Nested
    @DisplayName("읽음 처리")
    class MarkAsReadTest {

        @Test
        @DisplayName("성공: 읽음 포인터/시각 갱신")
        void markAsRead_success() {
            Long roomId = 100L;
            Long userId = 10L;
            Long lastReadMessageId = 1200L;

            User owner = user(userId, "사장");
            Store store = store(1L, owner);
            ChatRoom room = room(roomId, store, owner, ChatRoomType.GROUP);

            ChatRoomMember member = ChatRoomMember.builder()
                    .room(room)
                    .user(owner)
                    .memberRole(com.almaengi.be.domain.chat.type.ChatMemberRole.MEMBER)
                    .build();

            ChatMessageRequestDto.MarkRead request = new ChatMessageRequestDto.MarkRead();
            ReflectionTestUtils.setField(request, "lastReadMessageId", lastReadMessageId);

            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId))
                    .willReturn(Optional.of(member));

            chatMessageService.markAsRead(userId, roomId, request);

            verify(chatIntegrityValidator, times(1)).validateLastReadBelongsToRoom(roomId, lastReadMessageId);
            assertThat(member.getLastReadMessageId()).isEqualTo(lastReadMessageId);
            assertThat(member.getLastReadAt()).isNotNull();
        }

        @Test
        @DisplayName("실패: 읽음 포인터 역행이면 CHAT_INVALID_REFERENCE")
        void markAsRead_failWhenPointerMovesBackward() {
            Long roomId = 100L;
            Long userId = 10L;

            User owner = user(userId, "사장");
            Store store = store(1L, owner);
            ChatRoom room = room(roomId, store, owner, ChatRoomType.GROUP);

            ChatRoomMember member = ChatRoomMember.builder()
                    .room(room)
                    .user(owner)
                    .memberRole(com.almaengi.be.domain.chat.type.ChatMemberRole.MEMBER)
                    .build();
            member.updateLastRead(1200L, LocalDateTime.now());

            ChatMessageRequestDto.MarkRead request = new ChatMessageRequestDto.MarkRead();
            ReflectionTestUtils.setField(request, "lastReadMessageId", 1199L);

            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId))
                    .willReturn(Optional.of(member));

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatMessageService.markAsRead(userId, roomId, request));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_INVALID_REFERENCE);
        }

        @Test
        @DisplayName("실패: 비활성 멤버면 CHAT_MEMBER_NOT_ACTIVE")
        void markAsRead_failWhenNotActiveMember() {
            Long roomId = 100L;
            Long userId = 10L;

            User owner = user(userId, "사장");
            Store store = store(1L, owner);
            ChatRoom room = room(roomId, store, owner, ChatRoomType.GROUP);

            ChatMessageRequestDto.MarkRead request = new ChatMessageRequestDto.MarkRead();
            ReflectionTestUtils.setField(request, "lastReadMessageId", 1200L);

            given(chatRoomRepository.findById(roomId)).willReturn(Optional.of(room));
            given(chatRoomMemberRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId))
                    .willReturn(Optional.empty());

            BusinessException e = assertThrows(BusinessException.class,
                    () -> chatMessageService.markAsRead(userId, roomId, request));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.CHAT_MEMBER_NOT_ACTIVE);
        }
    }
    private User user(Long id, String name) {
        User user = User.builder()
                .name(name)
                .email(name + "@test.com")
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
    private Store store(Long id, User owner) {
        Store store = Store.builder()
                .owner(owner)
                .name("테스트매장")
                .address("서울시 강남구")
                .phone("010-0000-0000")
                .qrCode("qr-test")
                .isOver5Employees(false)
                .build();
        ReflectionTestUtils.setField(store, "id", id);
        return store;
    }
    private ChatRoom room(Long roomId, Store store, User createdBy, ChatRoomType roomType) {
        ChatRoom room = ChatRoom.builder()
                .store(store)
                .roomType(roomType)
                .name(roomType.name() + "-room")
                .createdBy(createdBy)
                .sortPriority(0)
                .build();
        ReflectionTestUtils.setField(room, "id", roomId);
        return room;
    }
}
