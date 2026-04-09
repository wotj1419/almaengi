package com.almaengi.be.domain.document.entity;

import com.almaengi.be.domain.document.type.DocType;
import com.almaengi.be.domain.document.type.EmployeeDocumentStatus;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

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
    @JoinColumns({
            @JoinColumn(name = "store_id", referencedColumnName = "store_id", nullable = false),
            @JoinColumn(name = "employee_id", referencedColumnName = "employee_id", nullable = false)
    })
    private StoreEmployee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", nullable = false, length = 50)
    private DocType docType;

    @Column(name = "file_url", nullable = false, length = 255)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmployeeDocumentStatus status;

    @Column(name = "expire_date")
    private LocalDate expireDate;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;

    @Builder
    public EmployeeDocument(StoreEmployee employee, DocType docType, String fileUrl,
                            LocalDate expireDate) {
        this.employee = employee;
        this.docType = docType;
        this.fileUrl = fileUrl;
        this.expireDate = expireDate;
        this.status = EmployeeDocumentStatus.SUBMITTED;
        this.uploadedAt = OffsetDateTime.now();
    }

    public void changeStatus(EmployeeDocumentStatus status) {
        this.status = status;
    }
}
