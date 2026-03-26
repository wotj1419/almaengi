package com.almaengi.be.domain.document.entity;

import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * 매장 문서함(employee_documents) 테이블을 매핑하는 엔티티입니다.
 * 급여명세서(PAYSLIP), 제출 서류 등 매장 단위로 관리되는 문서를 저장합니다.
 */
@Entity
@Table(name = "employee_documents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmployeeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "doc_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private StoreEmployee employee;

    @Column(name = "doc_type", length = 50, nullable = false)
    private String docType;

    @Column(name = "file_url", length = 255, nullable = false)
    private String fileUrl;

    @Column(name = "status", length = 20, nullable = false)
    private String status;

    @Column(name = "expire_date")
    private LocalDate expireDate;

    @Column(name = "uploaded_at", nullable = false)
    private OffsetDateTime uploadedAt;

    @Builder
    public EmployeeDocument(Store store, StoreEmployee employee, String docType,
                            String fileUrl, String status, LocalDate expireDate,
                            OffsetDateTime uploadedAt) {
        this.store = store;
        this.employee = employee;
        this.docType = docType;
        this.fileUrl = fileUrl;
        this.status = status != null ? status : "SUBMITTED";
        this.expireDate = expireDate;
        this.uploadedAt = uploadedAt != null ? uploadedAt : OffsetDateTime.now();
    }
}
