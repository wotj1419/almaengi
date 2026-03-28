package com.almaengi.be.domain.document.service;

import com.almaengi.be.domain.document.dto.DocumentResponseDto;
import com.almaengi.be.domain.document.entity.Document;
import com.almaengi.be.domain.document.repository.DocumentRepository;
import com.almaengi.be.domain.document.type.DocType;
import com.almaengi.be.domain.document.type.DocumentStatus;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.file.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public DocumentResponseDto.Info upload(Long userId, MultipartFile file,
                                           String docType, String expireDate) {
        DocType parsedDocType = parseDocType(docType);
        LocalDate parsedExpireDate = parseExpireDate(expireDate);
        if (parsedDocType != DocType.CONTRACT) {
            parsedExpireDate = null;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String fileUrl = fileStorageService.store(file, "users/" + userId, parsedDocType.name());

        Document document = Document.builder()
                .user(user)
                .docType(parsedDocType)
                .fileUrl(fileUrl)
                .expireDate(parsedExpireDate)
                .build();

        return DocumentResponseDto.Info.from(documentRepository.save(document));
    }

    public DocumentResponseDto.ListResponse getMyDocuments(Long userId) {
        List<Document> documents = documentRepository
                .findByUserIdAndStatusNot(userId, DocumentStatus.DELETED);
        return DocumentResponseDto.ListResponse.from(documents);
    }

    public DocumentResponseDto.Info getDocument(Long userId, Long docId) {
        Document document = documentRepository.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));
        return DocumentResponseDto.Info.from(document);
    }

    @Transactional
    public void deleteDocument(Long userId, Long docId) {
        Document document = documentRepository.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));
        document.softDelete();
    }

    private DocType parseDocType(String docType) {
        if (docType == null || docType.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_DOC_TYPE);
        }
        try {
            return DocType.valueOf(docType.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_DOC_TYPE);
        }
    }

    private LocalDate parseExpireDate(String expireDate) {
        if (expireDate == null || expireDate.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(expireDate.trim());
        } catch (DateTimeParseException e) {
            throw new BusinessException(ErrorCode.INVALID_EXPIRE_DATE);
        }
    }
}
