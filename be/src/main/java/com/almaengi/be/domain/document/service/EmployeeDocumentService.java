package com.almaengi.be.domain.document.service;

import com.almaengi.be.domain.document.dto.EmployeeDocumentResponseDto;
import com.almaengi.be.domain.document.entity.Document;
import com.almaengi.be.domain.document.entity.EmployeeDocument;
import com.almaengi.be.domain.document.repository.DocumentRepository;
import com.almaengi.be.domain.document.repository.EmployeeDocumentRepository;
import com.almaengi.be.domain.document.type.DocType;
import com.almaengi.be.domain.document.type.DocumentStatus;
import com.almaengi.be.domain.document.type.EmployeeDocumentStatus;
import com.almaengi.be.domain.notification.service.NotificationService;
import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
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
public class EmployeeDocumentService {

    private final EmployeeDocumentRepository employeeDocumentRepository;
    private final DocumentRepository documentRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final StoreRepository storeRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    @Transactional
    public EmployeeDocumentResponseDto.Info submitFromMyDoc(Long userId, Long storeId,
                                                            Long employeeId, Long documentId) {
        StoreEmployee employee = verifyEmployee(userId, storeId, employeeId);

        Document document = documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));

        if (document.getStatus() != DocumentStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.DOCUMENT_NOT_ACTIVE);
        }
        if (document.getExpireDate() != null && document.getExpireDate().isBefore(LocalDate.now())) {
            throw new BusinessException(ErrorCode.DOCUMENT_NOT_ACTIVE);
        }

        if (document.getDocType() == DocType.CONTRACT
                && employeeDocumentRepository.existsByEmployeeIdAndDocTypeAndStatus(
                    employeeId, document.getDocType(), EmployeeDocumentStatus.SUBMITTED)) {
            throw new BusinessException(ErrorCode.DOCUMENT_ALREADY_SUBMITTED);
        }

        String targetSubDir = document.getDocType() == DocType.OTHER
                ? "stores/" + storeId + "/other/" + userId
                : "stores/" + storeId;
        String newFileUrl = fileStorageService.copy(document.getFileUrl(), targetSubDir);

        EmployeeDocument empDoc = EmployeeDocument.builder()
                .employee(employee)
                .docType(document.getDocType())
                .fileUrl(newFileUrl)
                .expireDate(document.getExpireDate())
                .build();

        return EmployeeDocumentResponseDto.Info.from(employeeDocumentRepository.save(empDoc));
    }

    @Transactional
    public EmployeeDocumentResponseDto.Info uploadAndSubmit(Long userId, Long storeId,
                                                            Long employeeId, MultipartFile file,
                                                            String docType, String expireDate) {
        DocType parsedDocType = parseDocType(docType);
        LocalDate parsedExpireDate = parseExpireDate(expireDate);
        if (parsedDocType != DocType.CONTRACT) {
            parsedExpireDate = null;
        }

        StoreEmployee employee = verifyEmployee(userId, storeId, employeeId);

        if (parsedDocType == DocType.CONTRACT
                && employeeDocumentRepository.existsByEmployeeIdAndDocTypeAndStatus(
                    employeeId, parsedDocType, EmployeeDocumentStatus.SUBMITTED)) {
            throw new BusinessException(ErrorCode.DOCUMENT_ALREADY_SUBMITTED);
        }

        String targetSubDir = parsedDocType == DocType.OTHER
                ? "stores/" + storeId + "/other/" + userId
                : "stores/" + storeId;
        String fileUrl = fileStorageService.store(file, targetSubDir, parsedDocType.name());

        EmployeeDocument empDoc = EmployeeDocument.builder()
                .employee(employee)
                .docType(parsedDocType)
                .fileUrl(fileUrl)
                .expireDate(parsedExpireDate)
                .build();

        return EmployeeDocumentResponseDto.Info.from(employeeDocumentRepository.save(empDoc));
    }

    public EmployeeDocumentResponseDto.ListResponse getDocuments(Long userId, Long storeId,
                                                                  Long employeeId) {
        verifyAccess(userId, storeId, employeeId);

        List<EmployeeDocument> documents = employeeDocumentRepository.findByEmployeeIdWithUser(employeeId);
        return EmployeeDocumentResponseDto.ListResponse.from(documents);
    }

    @Transactional
    public EmployeeDocumentResponseDto.Info updateStatus(Long userId, Long storeId,
                                                          Long employeeId, Long docId,
                                                          EmployeeDocumentStatus status) {
        verifyStoreOwner(userId, storeId);
        verifyEmployeeBelongsToStore(employeeId, storeId);

        if (status != EmployeeDocumentStatus.APPROVED && status != EmployeeDocumentStatus.REJECTED) {
            throw new BusinessException(ErrorCode.DOCUMENT_INVALID_STATUS_TRANSITION);
        }

        EmployeeDocument document = employeeDocumentRepository.findByIdAndEmployeeId(docId, employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));

        if (document.getStatus() != EmployeeDocumentStatus.SUBMITTED) {
            throw new BusinessException(ErrorCode.DOCUMENT_INVALID_STATUS_TRANSITION);
        }

        document.changeStatus(status);
        return EmployeeDocumentResponseDto.Info.from(document);
    }

    @Transactional
    public void requestDocument(Long userId, Long storeId, Long employeeId, DocType docType) {
        Store store = verifyStoreOwner(userId, storeId);

        StoreEmployee employee = storeEmployeeRepository.findByIdWithUser(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));

        if (!employee.getStore().getId().equals(storeId)) {
            throw new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND);
        }

        notificationService.sendNotification(
                employee.getUser(),
                NotificationType.DOCUMENT,
                "서류 제출 요청",
                store.getName() + "에서 " + docType.getDescription() + " 제출을 요청했습니다.",
                employeeId
        );
    }

    private StoreEmployee verifyEmployee(Long userId, Long storeId, Long employeeId) {
        StoreEmployee employee = storeEmployeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));

        if (!employee.getStore().getId().equals(storeId)) {
            throw new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND);
        }

        if (!employee.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }

        return employee;
    }

    private void verifyAccess(Long userId, Long storeId, Long employeeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        StoreEmployee employee = storeEmployeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));

        if (!employee.getStore().getId().equals(storeId)) {
            throw new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND);
        }

        if (store.getOwner().getId().equals(userId)) {
            return;
        }

        if (!employee.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }
    }

    private void verifyEmployeeBelongsToStore(Long employeeId, Long storeId) {
        StoreEmployee employee = storeEmployeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));

        if (!employee.getStore().getId().equals(storeId)) {
            throw new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND);
        }
    }

    private Store verifyStoreOwner(Long userId, Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if (!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }

        return store;
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
