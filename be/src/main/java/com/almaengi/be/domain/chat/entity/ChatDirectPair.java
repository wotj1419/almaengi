package com.almaengi.be.domain.chat.entity;

import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "chat_direct_pairs",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_chat_direct_pairs_store_users", columnNames = {"store_id", "user1_id", "user2_id"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatDirectPair {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pair_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, unique = true)
    private ChatRoom room;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public ChatDirectPair(Store store, User user1, User user2, ChatRoom room) {
        this.store = store;
        this.user1 = user1;
        this.user2 = user2;
        this.room = room;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if(createdAt == null) createdAt = LocalDateTime.now();
    }
}
