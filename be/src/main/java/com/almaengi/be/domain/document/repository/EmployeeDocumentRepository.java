package com.almaengi.be.domain.document.repository;

import com.almaengi.be.domain.document.entity.EmployeeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * 매장 문서함(employee_documents) 리포지토리입니다.
 */
@Repository
public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, Long> {

    /**
     * 특정 직원의 특정 문서 유형 중 업로드 일시 범위로 조회합니다.
     * 급여명세서 upsert 시 해당 월 문서 존재 여부를 확인합니다.
     */
    Optional<EmployeeDocument> findByEmployeeIdAndDocTypeAndUploadedAtBetween(
            Long employeeId, String docType, OffsetDateTime start, OffsetDateTime end);

}
