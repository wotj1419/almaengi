package com.almaengi.be.domain.document.repository;

import com.almaengi.be.domain.document.entity.EmployeeDocument;
import com.almaengi.be.domain.document.type.DocType;
import com.almaengi.be.domain.document.type.EmployeeDocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
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

    // 직원의 제출 문서 목록 조회 (단순)
    List<EmployeeDocument> findByEmployeeId(Long employeeId);

    // 문서 ID + 직원 ID로 단건 조회
    Optional<EmployeeDocument> findByIdAndEmployeeId(Long docId, Long employeeId);

    // 직원의 제출 문서 목록 조회 (JOIN FETCH로 employee + user 즉시 로딩, 최신순 정렬)
    @Query("SELECT ed FROM EmployeeDocument ed JOIN FETCH ed.employee e JOIN FETCH e.user WHERE e.id = :employeeId ORDER BY ed.uploadedAt DESC")
    List<EmployeeDocument> findByEmployeeIdWithUser(@Param("employeeId") Long employeeId);

    // 동일 직원 + 동일 문서유형 + SUBMITTED 상태 중복 제출 체크
    boolean existsByEmployeeIdAndDocTypeAndStatus(Long employeeId, DocType docType, EmployeeDocumentStatus status);

    // fileUrl로 문서 조회 (파일 다운로드 권한 검증용, JOIN FETCH로 employee + user 즉시 로딩)
    @Query("SELECT ed FROM EmployeeDocument ed JOIN FETCH ed.employee e JOIN FETCH e.user WHERE ed.fileUrl = :fileUrl")
    Optional<EmployeeDocument> findByFileUrlWithEmployee(@Param("fileUrl") String fileUrl);
}
