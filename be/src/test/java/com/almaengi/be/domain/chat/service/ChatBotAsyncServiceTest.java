package com.almaengi.be.domain.chat.service;

import com.almaengi.be.domain.chat.ChatBotProperties;
import com.almaengi.be.domain.chat.client.RagClient;
import com.almaengi.be.domain.chat.entity.ChatMessage;
import com.almaengi.be.domain.chat.entity.ChatRoom;
import com.almaengi.be.domain.chat.repository.ChatMessageRepository;
import com.almaengi.be.domain.chat.repository.ChatRoomRepository;
import com.almaengi.be.domain.chat.type.ChatRoomType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatBotAsyncService Step4 단위 테스트")
class ChatBotAsyncServiceTest {
    @InjectMocks
    private ChatBotAsyncService chatBotAsyncService;
    @Mock
    private ChatRoomRepository chatRoomRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ChatBotProperties chatBotProperties;
    @Mock
    private RagClient ragClient;
    @Nested
    @DisplayName("비동기 BOT 응답 저장")
    class GenerateAndSaveBotReplyTest {
        @Test
        @DisplayName("room이 없으면 즉시 종료")
        void returnWhenRoomNotFound() {
            given(chatRoomRepository.findById(100L)).willReturn(Optional.empty());
            chatBotAsyncService.generateAndSaveBotReply(1L, 100L, 10L, 1000L, "질문");
            verify(chatMessageRepository, never()).save(any(ChatMessage.class));
            verify(ragClient, never()).ask(anyLong(), anyLong(), anyLong(), anyLong(), anyString(), anyList());
        }
        @Test
        @DisplayName("botUser가 없으면 즉시 종료")
        void returnWhenBotUserNotFound() {
            User owner = user(1L, "사장");
            Store store = store(1L, owner);
            ChatRoom room = room(100L, store, owner);
            given(chatRoomRepository.findById(100L)).willReturn(Optional.of(room));
            given(chatBotProperties.getBotUserId()).willReturn(999L);
            given(userRepository.findById(999L)).willReturn(Optional.empty());
            chatBotAsyncService.generateAndSaveBotReply(1L, 100L, 10L, 1000L, "질문");
            verify(chatMessageRepository, never()).save(any(ChatMessage.class));
            verify(ragClient, never()).ask(anyLong(), anyLong(), anyLong(), anyLong(), anyString(), anyList());
        }
        @Test
        @DisplayName("RAG 성공 시 bot 답변 저장 + room 포인터 갱신")
        void saveBotAnswerWhenRagSuccess() {
            User owner = user(1L, "사장");
            User botUser = user(999L, "알맹이봇");
            Store store = store(1L, owner);
            ChatRoom room = room(100L, store, owner);
            ChatMessage history = ChatMessage.createText(room, owner, "이전 대화");
            ReflectionTestUtils.setField(history, "id", 900L);
            given(chatRoomRepository.findById(100L)).willReturn(Optional.of(room));
            given(chatBotProperties.getBotUserId()).willReturn(999L);
            given(userRepository.findById(999L)).willReturn(Optional.of(botUser));
            given(chatMessageRepository.findPageByRoomIdWithCursor(eq(100L), eq(null), any(Pageable.class)))
                    .willReturn(List.of(history));
            given(ragClient.ask(eq(1L), eq(100L), eq(10L), eq(1000L), eq("질문"), anyList()))
                    .willReturn("봇 응답입니다.");
            ChatMessage saved = ChatMessage.createBotText(room, botUser, "봇 응답입니다.");
            ReflectionTestUtils.setField(saved, "id", 1001L);
            ReflectionTestUtils.setField(saved, "sentAt", LocalDateTime.of(2026, 3, 22, 12, 0));
            given(chatMessageRepository.save(any(ChatMessage.class))).willReturn(saved);
            chatBotAsyncService.generateAndSaveBotReply(1L, 100L, 10L, 1000L, "질문");
            ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
            verify(chatMessageRepository).save(captor.capture());
            assertThat(captor.getValue().getContent()).isEqualTo("봇 응답입니다.");
            assertThat(room.getLastMessageId()).isEqualTo(1001L);
            assertThat(room.getLastMessageAt()).isEqualTo(LocalDateTime.of(2026, 3, 22, 12, 0));
        }
        @Test
        @DisplayName("RAG 예외 시 fallback 문구 저장")
        void saveFallbackWhenRagFails() {
            User owner = user(1L, "사장");
            User botUser = user(999L, "알맹이봇");
            Store store = store(1L, owner);
            ChatRoom room = room(100L, store, owner);
            given(chatRoomRepository.findById(100L)).willReturn(Optional.of(room));
            given(chatBotProperties.getBotUserId()).willReturn(999L);
            given(userRepository.findById(999L)).willReturn(Optional.of(botUser));
            given(chatMessageRepository.findPageByRoomIdWithCursor(eq(100L), eq(null), any(Pageable.class)))
                    .willReturn(List.of());
            given(ragClient.ask(anyLong(), anyLong(), anyLong(), anyLong(), anyString(), anyList()))
                    .willThrow(new RuntimeException("RAG timeout"));
            ChatMessage saved = ChatMessage.createFallbackText(room, botUser,
                    "현재 답변 생성이 지연되고 있습니다. 잠시 후 다시 시도해주세요.");
            ReflectionTestUtils.setField(saved, "id", 1002L);
            ReflectionTestUtils.setField(saved, "sentAt", LocalDateTime.of(2026, 3, 22, 12, 1));
            given(chatMessageRepository.save(any(ChatMessage.class))).willReturn(saved);
            chatBotAsyncService.generateAndSaveBotReply(1L, 100L, 10L, 1000L, "질문");
            ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
            verify(chatMessageRepository).save(captor.capture());
            assertThat(captor.getValue().getContent()).contains("지연되고 있습니다");
            assertThat(room.getLastMessageId()).isEqualTo(1002L);
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
    private ChatRoom room(Long roomId, Store store, User createdBy) {
        ChatRoom room = ChatRoom.builder()
                .store(store)
                .roomType(ChatRoomType.BOT)
                .name("AI 업무 도우미")
                .createdBy(createdBy)
                .sortPriority(10_000)
                .build();
        ReflectionTestUtils.setField(room, "id", roomId);
        return room;
    }
}