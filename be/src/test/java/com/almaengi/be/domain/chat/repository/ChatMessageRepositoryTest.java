package com.almaengi.be.domain.chat.repository;

import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.chat.entity.ChatMessage;
import com.almaengi.be.domain.chat.entity.ChatRoom;
import com.almaengi.be.domain.chat.type.ChatMessageType;
import com.almaengi.be.domain.chat.type.ChatRoomType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.config.JpaAuditingConfig;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Constructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Import(JpaAuditingConfig.class)
@DisplayName("ChatMessageRepository 테스트")
class ChatMessageRepositoryTest {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private EntityManager em;

    @Test
    @DisplayName("커서 기반 조회: cursor 이전 메시지를 id DESC로 반환")
    void findPageByRoomIdWithCursor_success() {
        User owner = persistUser("owner-chat-1@test.com", "사장1", Role.OWNER);
        Store store = persistStore(owner, "채팅매장1");
        ChatRoom room = persistRoom(store, owner, ChatRoomType.DM);

        ChatMessage m1 = persistTextMessage(room, owner, "m1");
        ChatMessage m2 = persistTextMessage(room, owner, "m2");
        ChatMessage m3 = persistTextMessage(room, owner, "m3");

        em.flush();
        em.clear();

        List<ChatMessage> result = chatMessageRepository.findPageByRoomIdWithCursor(
                room.getId(),
                m3.getId(),
                PageRequest.of(0, 10)
        );

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(m2.getId());
        assertThat(result.get(1).getId()).isEqualTo(m1.getId());
    }

    @Test
    @DisplayName("최신 메시지 조회: findTopByRoomIdOrderByIdDesc")
    void findTopByRoomIdOrderByIdDesc_success() {
        User owner = persistUser("owner-chat-2@test.com", "사장2", Role.OWNER);
        Store store = persistStore(owner, "채팅매장2");
        ChatRoom room = persistRoom(store, owner, ChatRoomType.GROUP);

        persistTextMessage(room, owner, "old");
        ChatMessage latest = persistTextMessage(room, owner, "latest");

        em.flush();
        em.clear();

        Optional<ChatMessage> found = chatMessageRepository.findTopByRoomIdOrderByIdDesc(room.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(latest.getId());
    }

    @Test
    @DisplayName("존재 검증: existsByIdAndRoomId가 room 일치 여부를 정확히 판별")
    void existsByIdAndRoomId_success() {
        User owner = persistUser("owner-chat-3@test.com", "사장3", Role.OWNER);
        Store store = persistStore(owner, "채팅매장3");
        ChatRoom room1 = persistRoom(store, owner, ChatRoomType.DM);
        ChatRoom room2 = persistRoom(store, owner, ChatRoomType.BOT);

        ChatMessage message = persistTextMessage(room1, owner, "hello");

        em.flush();
        em.clear();

        boolean inRoom1 = chatMessageRepository.existsByIdAndRoomId(message.getId(), room1.getId());
        boolean inRoom2 = chatMessageRepository.existsByIdAndRoomId(message.getId(), room2.getId());

        assertThat(inRoom1).isTrue();
        assertThat(inRoom2).isFalse();
    }

    private User persistUser(String email, String name, Role role) {
        User user = User.builder()
                .loginType(LoginType.LOCAL)
                .password("password")
                .role(role)
                .name(name)
                .email(email)
                .build();
        em.persist(user);
        return user;
    }

    private Store persistStore(User owner, String storeName) {
        Store store = Store.builder()
                .owner(owner)
                .name(storeName)
                .address("서울시 강남구")
                .phone("010-1111-1111")
                .isOver5Employees(false)
                .qrCode("qr-" + storeName)
                .build();
        em.persist(store);
        return store;
    }

    private ChatRoom persistRoom(Store store, User createdBy, ChatRoomType roomType) {
        ChatRoom room = ChatRoom.builder()
                .store(store)
                .roomType(roomType)
                .name(roomType.name() + "-room")
                .createdBy(createdBy)
                .sortPriority(0)
                .build();
        em.persist(room);
        return room;
    }

    /**
     * ChatMessage는 현재 public 생성자/빌더가 없으므로
     * 테스트에서만 reflection으로 생성해 필드를 채웁니다.
     */
    private ChatMessage persistTextMessage(ChatRoom room, User sender, String content) {
        try {
            Constructor<ChatMessage> constructor = ChatMessage.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            ChatMessage message = constructor.newInstance();

            ReflectionTestUtils.setField(message, "room", room);
            ReflectionTestUtils.setField(message, "sender", sender);
            ReflectionTestUtils.setField(message, "messageType", ChatMessageType.TEXT);
            ReflectionTestUtils.setField(message, "content", content);
            ReflectionTestUtils.setField(message, "fileUrl", null);
            ReflectionTestUtils.setField(message, "metaJson", null);
            ReflectionTestUtils.setField(message, "sentAt", LocalDateTime.now());
            ReflectionTestUtils.setField(message, "readCount", 0);
            ReflectionTestUtils.setField(message, "isDeleted", false);
            ReflectionTestUtils.setField(message, "deletedAt", null);

            em.persist(message);
            return message;
        } catch (Exception e) {
            throw new IllegalStateException("ChatMessage 테스트 데이터 생성 실패", e);
        }
    }
}
