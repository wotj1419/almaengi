package com.almaengi.be.domain.document.dto;

import com.almaengi.be.domain.document.type.DocType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDate;

public class DocumentRequestDto {

    @Schema(description = "문서 업로드 요청 DTO")
    @Getter
    public static class Upload {
        @NotNull(message = "문서 유형은 필수입니다.")
        @Schema(description = "문서 유형", example = "CONTRACT")
        private DocType docType;

        @Schema(description = "만료일 (선택)", example = "2026-12-31")
        private LocalDate expireDate;
    }
}
