package com.almaengi.be.domain.document.dto;

import com.almaengi.be.domain.document.type.DocType;
import com.almaengi.be.domain.document.type.EmployeeDocumentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDate;

public class EmployeeDocumentRequestDto {

    @Schema(description = "기존 문서로 제출 요청 DTO")
    @Getter
    public static class Submit {
        @NotNull(message = "문서 ID는 필수입니다.")
        @Schema(description = "개인 문서함의 문서 ID", example = "1")
        private Long documentId;
    }

    @Schema(description = "직접 파일 업로드 제출 요청 DTO")
    @Getter
    public static class Upload {
        @NotNull(message = "문서 유형은 필수입니다.")
        @Schema(description = "문서 유형", example = "CONTRACT")
        private DocType docType;

        @Schema(description = "만료일 (선택)", example = "2026-12-31")
        private LocalDate expireDate;
    }

    @Schema(description = "문서 상태 변경 요청 DTO")
    @Getter
    public static class StatusUpdate {
        @NotNull(message = "상태는 필수입니다.")
        @Schema(description = "변경할 상태", example = "APPROVED")
        private EmployeeDocumentStatus status;
    }

    @Schema(description = "서류 제출 요청 DTO (사장님 → 알바생 알림)")
    @Getter
    public static class Request {
        @NotNull(message = "문서 유형은 필수입니다.")
        @Schema(description = "요청할 문서 유형", example = "CONTRACT")
        private DocType docType;
    }
}
