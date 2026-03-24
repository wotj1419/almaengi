package com.almaengi.be.domain.chat.repository;

import com.almaengi.be.domain.chat.entity.ChatRoom;
import com.almaengi.be.domain.chat.type.ChatRoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByIdAndStoreId(Long roomId, Long storeId);
    Optional<ChatRoom> findByStoreIdAndRoomType(Long storeId, ChatRoomType roomType);
    // 매장 내 특정 타입 방 조회 (archive 상태는 제외)
    Optional<ChatRoom> findByStoreIdAndRoomTypeAndIsArchivedFalse(Long storeId, ChatRoomType roomType);

    // 개인화 BOT 방 조회: 같은 매장 + BOT 타입 + 활성 멤버(요청자) 조건
    @Query("""
        SELECT r FROM ChatRoom r
        JOIN ChatRoomMember m ON m.room.id = r.id
        WHERE r.store.id = :storeId
          AND r.roomType = :roomType
          AND r.isArchived = false
          AND m.user.id = :userId
          AND m.leftAt IS NULL
    """)
    Optional<ChatRoom> findPersonalBotRoom(Long storeId, Long userId, ChatRoomType roomType);
}
