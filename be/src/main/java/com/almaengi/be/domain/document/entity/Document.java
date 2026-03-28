package com.almaengi.be.domain.document.entity;

import com.almaengi.be.domain.document.type.DocType;
import com.almaengi.be.domain.document.type.DocumentStatus;
import com.almaengi.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "documents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "doc_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", nullable = false, length = 50)
    private DocType docType;

    @Column(name = "file_url", nullable = false, length = 255)
    private String fileUrl;

    @Column(name = "expire_date")
    private LocalDate expireDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentStatus status;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;

    @Builder
    public Document(User user, DocType docType, String fileUrl,
                    LocalDate expireDate, DocumentStatus status) {
        this.user = user;
        this.docType = docType;
        this.fileUrl = fileUrl;
        this.expireDate = expireDate;
        this.status = status != null ? status : DocumentStatus.ACTIVE;
        this.uploadedAt = OffsetDateTime.now();
    }

    public void softDelete() {
        this.status = DocumentStatus.DELETED;
    }

    public void changeStatus(DocumentStatus status) {
        this.status = status;
    }
}
