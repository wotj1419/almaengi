package com.almaengi.be.domain.document.repository;

import com.almaengi.be.domain.document.entity.Document;
import com.almaengi.be.domain.document.type.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    // 삭제되지 않은 문서만 조회 (개인 문서함 목록)
    List<Document> findByUserIdAndStatusNot(Long userId, DocumentStatus status);

    // 특정 문서 + 소유자 일치 확인
    Optional<Document> findByIdAndUserId(Long docId, Long userId);
}
