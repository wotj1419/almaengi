package com.almaengi.be.domain.chat.repository;

import com.almaengi.be.domain.chat.entity.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {
    Optional<ChatRoomMember> findByRoomIdAndUserId(Long roomId, Long userId);
    Optional<ChatRoomMember> findByRoomIdAndUserIdAndLeftAtIsNull(Long roomId, Long userId);
    boolean existsByRoomIdAndUserIdAndLeftAtIsNull(Long roomId, Long userId);
    List<ChatRoomMember> findByRoomIdAndLeftAtIsNull(Long roomId);

    // 내가 참여중인 방 목록 조회(매장별, archived 제외)
    @Query("""
        SELECT m FROM ChatRoomMember m
        JOIN FETCH m.room r
        WHERE m.user.id = :userId
            AND m.leftAt IS NULL
            AND r.store.id = :storeId
            AND r.isArchived = false
    """)
    List<ChatRoomMember> findActiveMembersWithRoomByUserIdAndStoreId(Long userId, Long storeId);
}
