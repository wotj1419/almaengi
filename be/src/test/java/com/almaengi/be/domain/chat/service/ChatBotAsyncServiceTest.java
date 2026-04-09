package com.almaengi.be.domain.chat.service;

import com.almaengi.be.domain.chat.ChatBotProperties;
import com.almaengi.be.domain.chat.client.RagClient;
import com.almaengi.be.domain.chat.dto.ChatMessageResponseDto;
import com.almaengi.be.domain.chat.entity.ChatMessage;
import com.almaengi.be.domain.chat.entity.ChatRoom;
import com.almaengi.be.domain.chat.repository.ChatMessageRepository;
import com.almaengi.be.domain.chat.repository.ChatRoomRepository;
import com.almaengi.be.domain.chat.type.ChatRoomType;
import com.almaengi.be.domain.chat.ws.pubsub.ChatRedisPublisher;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatBotAsyncService 단위 테스트")
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

    @Mock
    private ChatRedisPublisher chatRedisPublisher;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @Nested
    @DisplayName("generateAndSaveBotReply")
    class GenerateAndSaveBotReplyTest {

        private void runAfterCommitCallbacks() {
            List<TransactionSynchronization> syncs = TransactionSynchronizationManager.getSynchronizations();
            for (TransactionSynchronization sync : syncs) {
                sync.afterCommit();
            }
        }

        @Test
        @DisplayName("room이 없으면 조용히 종료하고 어떤 저장/호출도 하지 않는다")
        void returnWhenRoomNotFound() {
            given(chatRoomRepository.findById(100L)).willReturn(Optional.empty());

            chatBotAsyncService.generateAndSaveBotReply(1L, 100L, 10L, 1000L, "질문", "OWNER");

            verify(chatMessageRepository, never()).save(any(ChatMessage.class));
            verify(ragClient, never()).ask(any(RagClient.RagRequest.class));
            verify(chatRedisPublisher, never()).publishMessageCreated(any(), any(ChatMessageResponseDto.MessageItem.class));
        }

        @Test
        @DisplayName("bot user가 없으면 조용히 종료하고 저장/호출하지 않는다")
        void returnWhenBotUserNotFound() {
            User owner = user(1L, "사장");
            Store store = store(1L, owner);
            ChatRoom room = room(100L, store, owner);

            given(chatRoomRepository.findById(100L)).willReturn(Optional.of(room));
            given(chatBotProperties.getBotUserId()).willReturn(999L);
            given(userRepository.findById(999L)).willReturn(Optional.empty());

            chatBotAsyncService.generateAndSaveBotReply(1L, 100L, 10L, 1000L, "질문", "OWNER");

            verify(chatMessageRepository, never()).save(any(ChatMessage.class));
            verify(ragClient, never()).ask(any(RagClient.RagRequest.class));
            verify(chatRedisPublisher, never()).publishMessageCreated(any(), any(ChatMessageResponseDto.MessageItem.class));
        }

        @Test
        @DisplayName("RAG 성공 시 answer/sources/intent를 meta_json에 저장하고 커밋 후 publish 한다")
        void saveBotAnswerWithMetaAndPublishAfterCommit() throws Exception {
            TransactionSynchronizationManager.initSynchronization();
            try {
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
                given(ragClient.ask(any(RagClient.RagRequest.class)))
                        .willReturn(new RagClient.RagResult(
                                "봇 응답입니다.",
                                List.of("근로기준법 제55조", "근로기준법 제18조"),
                                "LEGAL_QUERY"
                        ));

                ChatMessage saved = ChatMessage.createBotText(room, botUser, "봇 응답입니다.");
                ReflectionTestUtils.setField(saved, "id", 1001L);
                ReflectionTestUtils.setField(saved, "sentAt", LocalDateTime.of(2026, 3, 22, 12, 0));
                given(chatMessageRepository.save(any(ChatMessage.class))).willReturn(saved);

                chatBotAsyncService.generateAndSaveBotReply(1L, 100L, 10L, 1000L, "질문", "OWNER");

                ArgumentCaptor<RagClient.RagRequest> ragRequestCaptor = ArgumentCaptor.forClass(RagClient.RagRequest.class);
                verify(ragClient, times(1)).ask(ragRequestCaptor.capture());

                RagClient.RagRequest ragRequest = ragRequestCaptor.getValue();
                assertThat(ragRequest.question()).isEqualTo("질문");
                assertThat(ragRequest.role()).isEqualTo("OWNER");
                assertThat(ragRequest.storeId()).isEqualTo(1L);
                assertThat(ragRequest.history()).contains("이전 대화");

                ArgumentCaptor<ChatMessage> messageCaptor = ArgumentCaptor.forClass(ChatMessage.class);
                verify(chatMessageRepository, times(1)).save(messageCaptor.capture());
                ChatMessage toSave = messageCaptor.getValue();

                assertThat(toSave.getContent()).isEqualTo("봇 응답입니다.");
                JsonNode meta = objectMapper.readTree(toSave.getMetaJson());
                assertThat(meta.get("answer").asText()).isEqualTo("봇 응답입니다.");
                assertThat(meta.get("intent").asText()).isEqualTo("LEGAL_QUERY");
                assertThat(meta.get("sources").size()).isEqualTo(2);

                // room 포인터 갱신 확인
                assertThat(room.getLastMessageId()).isEqualTo(1001L);
                assertThat(room.getLastMessageAt()).isEqualTo(LocalDateTime.of(2026, 3, 22, 12, 0));

                // 트랜잭션 커밋 이후 publish 동작 확인
                runAfterCommitCallbacks();
                verify(chatRedisPublisher, times(1))
                        .publishMessageCreated(eq(100L), any(ChatMessageResponseDto.MessageItem.class));
            } finally {
                TransactionSynchronizationManager.clearSynchronization();
            }
        }

        @Test
        @DisplayName("RAG 예외 시 fallback을 저장하고 빈 sources/null intent로 publish 한다")
        void saveFallbackWhenRagFails() throws Exception {
            TransactionSynchronizationManager.initSynchronization();
            try {
                User owner = user(1L, "사장");
                User botUser = user(999L, "알맹이봇");
                Store store = store(1L, owner);
                ChatRoom room = room(100L, store, owner);

                given(chatRoomRepository.findById(100L)).willReturn(Optional.of(room));
                given(chatBotProperties.getBotUserId()).willReturn(999L);
                given(userRepository.findById(999L)).willReturn(Optional.of(botUser));
                given(chatMessageRepository.findPageByRoomIdWithCursor(eq(100L), eq(null), any(Pageable.class)))
                        .willReturn(List.of());
                given(ragClient.ask(any(RagClient.RagRequest.class)))
                        .willThrow(new RuntimeException("RAG timeout"));

                ChatMessage saved = ChatMessage.createFallbackText(
                        room,
                        botUser,
                        "현재 답변 생성이 지연되고 있습니다. 잠시 후 다시 시도해주세요."
                );
                ReflectionTestUtils.setField(saved, "id", 1002L);
                ReflectionTestUtils.setField(saved, "sentAt", LocalDateTime.of(2026, 3, 22, 12, 1));
                given(chatMessageRepository.save(any(ChatMessage.class))).willReturn(saved);

                chatBotAsyncService.generateAndSaveBotReply(1L, 100L, 10L, 1000L, "질문", "EMPLOYEE");

                ArgumentCaptor<ChatMessage> messageCaptor = ArgumentCaptor.forClass(ChatMessage.class);
                verify(chatMessageRepository, times(1)).save(messageCaptor.capture());
                ChatMessage toSave = messageCaptor.getValue();

                assertThat(toSave.getContent()).contains("지연되고 있습니다");

                JsonNode meta = objectMapper.readTree(toSave.getMetaJson());
                assertThat(meta.get("answer").asText()).contains("지연되고 있습니다");
                assertThat(meta.get("sources").isArray()).isTrue();
                assertThat(meta.get("sources").size()).isEqualTo(0);
                assertThat(meta.get("intent").isNull()).isTrue();

                runAfterCommitCallbacks();
                verify(chatRedisPublisher, times(1))
                        .publishMessageCreated(eq(100L), any(ChatMessageResponseDto.MessageItem.class));
            } finally {
                TransactionSynchronizationManager.clearSynchronization();
            }
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
