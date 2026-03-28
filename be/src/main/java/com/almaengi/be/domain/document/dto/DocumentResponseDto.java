package com.almaengi.be.domain.document.dto;

import com.almaengi.be.domain.document.entity.Document;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class DocumentResponseDto {

    @Schema(description = "문서 정보 응답 DTO")
    @Getter
    @Builder
    public static class Info {
        @Schema(description = "문서 ID", example = "1")
        private Long docId;

        @Schema(description = "문서 유형", example = "CONTRACT")
        private String docType;

        @Schema(description = "문서 유형 설명", example = "근로계약서")
        private String docTypeDescription;

        @Schema(description = "파일 URL", example = "users/1/uuid.pdf")
        private String fileUrl;

        @Schema(description = "만료일", example = "2026-12-31")
        private LocalDate expireDate;

        @Schema(description = "상태", example = "ACTIVE")
        private String status;

        @Schema(description = "업로드 일시")
        private OffsetDateTime uploadedAt;

        public static Info from(Document doc) {
            return Info.builder()
                    .docId(doc.getId())
                    .docType(doc.getDocType().name())
                    .docTypeDescription(doc.getDocType().getDescription())
                    .fileUrl(doc.getFileUrl())
                    .expireDate(doc.getExpireDate())
                    .status(doc.getStatus().name())
                    .uploadedAt(doc.getUploadedAt())
                    .build();
        }
    }

    @Schema(description = "문서 목록 응답 DTO")
    @Getter
    @Builder
    public static class ListResponse {
        @Schema(description = "문서 목록")
        private List<Info> documents;

        public static ListResponse from(List<Document> docs) {
            return ListResponse.builder()
                    .documents(docs.stream().map(Info::from).toList())
                    .build();
        }
    }
}
