package com.almaengi.be.domain.chat.repository;

import com.almaengi.be.domain.chat.entity.ChatDirectPair;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatDirectPairRepository extends JpaRepository<ChatDirectPair, Long> {
    Optional<ChatDirectPair> findByStoreIdAndUser1IdAndUser2Id(Long storeId, Long user1Id, Long user2Id);
}
