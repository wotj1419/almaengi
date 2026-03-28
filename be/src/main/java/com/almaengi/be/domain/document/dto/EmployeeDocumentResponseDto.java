package com.almaengi.be.domain.document.dto;

import com.almaengi.be.domain.document.entity.EmployeeDocument;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class EmployeeDocumentResponseDto {

    @Schema(description = "제출 문서 정보 응답 DTO")
    @Getter
    @Builder
    public static class Info {
        @Schema(description = "문서 ID", example = "1")
        private Long docId;

        @Schema(description = "직원 ID", example = "1")
        private Long employeeId;

        @Schema(description = "직원 이름", example = "김알바")
        private String employeeName;

        @Schema(description = "문서 유형", example = "CONTRACT")
        private String docType;

        @Schema(description = "문서 유형 설명", example = "근로계약서")
        private String docTypeDescription;

        @Schema(description = "파일 URL", example = "stores/1/uuid.pdf")
        private String fileUrl;

        @Schema(description = "상태", example = "SUBMITTED")
        private String status;

        @Schema(description = "만료일", example = "2026-12-31")
        private LocalDate expireDate;

        @Schema(description = "업로드 일시")
        private OffsetDateTime uploadedAt;

        public static Info from(EmployeeDocument doc) {
            return Info.builder()
                    .docId(doc.getId())
                    .employeeId(doc.getEmployee().getId())
                    .employeeName(doc.getEmployee().getUser().getName())
                    .docType(doc.getDocType().name())
                    .docTypeDescription(doc.getDocType().getDescription())
                    .fileUrl(doc.getFileUrl())
                    .status(doc.getStatus().name())
                    .expireDate(doc.getExpireDate())
                    .uploadedAt(doc.getUploadedAt())
                    .build();
        }
    }

    @Schema(description = "제출 문서 목록 응답 DTO")
    @Getter
    @Builder
    public static class ListResponse {
        @Schema(description = "제출 서류 목록")
        private List<Info> documents;

        public static ListResponse from(List<EmployeeDocument> docs) {
            return ListResponse.builder()
                    .documents(docs.stream().map(Info::from).toList())
                    .build();
        }
    }
}
