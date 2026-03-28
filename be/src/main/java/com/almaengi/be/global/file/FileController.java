package com.almaengi.be.global.file;

import com.almaengi.be.domain.document.entity.EmployeeDocument;
import com.almaengi.be.domain.document.repository.EmployeeDocumentRepository;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Tag(name = "파일 다운로드 API", description = "업로드된 파일 다운로드 API")
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;
    private final StoreRepository storeRepository;
    private final EmployeeDocumentRepository employeeDocumentRepository;

    @Operation(summary = "파일 다운로드/미리보기", description = "저장된 파일을 다운로드하거나 인라인으로 표시합니다. inline=true 시 브라우저에서 직접 렌더링합니다. 본인 문서 또는 본인이 제출한 매장 문서, 사장님만 접근 가능합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "성공"),
            @ApiResponse(responseCode = "400", description = "G002: 잘못된 입력값입니다."),
            @ApiResponse(responseCode = "403", description = "U004: 접근 권한이 없는 유저입니다."),
            @ApiResponse(responseCode = "404", description = "D003: 파일을 찾을 수 없습니다.")
    })
    @GetMapping("/**")
    public ResponseEntity<Resource> downloadFile(
            @Parameter(hidden = true) @AuthUser Long userId,
            @Parameter(description = "true이면 브라우저에서 인라인 표시, false이면 다운로드", example = "false")
            @RequestParam(value = "inline", defaultValue = "false") boolean inline,
            @Parameter(hidden = true) HttpServletRequest request) {

        String filePath = extractAndValidateFilePath(request);

        verifyFileAccess(userId, filePath);

        Resource resource = fileStorageService.loadAsResource(filePath);

        String contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        try {
            Path path = resource.getFile().toPath();
            String probed = Files.probeContentType(path);
            if (probed != null) {
                contentType = probed;
            }
        } catch (IOException ignored) {
        }

        String filename = resource.getFilename() != null ? resource.getFilename() : "download";
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                .replace("+", "%20");

        String disposition = inline
                ? "inline; filename*=UTF-8''" + encodedFilename
                : "attachment; filename*=UTF-8''" + encodedFilename;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .body(resource);
    }

    private String extractAndValidateFilePath(HttpServletRequest request) {
        String pathWithinMapping = (String) request.getAttribute(
                HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);

        String filePath;
        if (pathWithinMapping != null) {
            filePath = pathWithinMapping.substring("/api/v1/files/".length());
        } else {
            filePath = request.getRequestURI().substring("/api/v1/files/".length());
        }

        filePath = URLDecoder.decode(filePath, StandardCharsets.UTF_8);

        Path normalized;
        try {
            normalized = Paths.get(filePath).normalize();
        } catch (InvalidPathException e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
        }
        String normalizedStr = normalized.toString().replace('\\', '/');

        if (normalizedStr.contains("..") || normalizedStr.startsWith("/")
                || (normalizedStr.length() >= 2 && normalizedStr.charAt(1) == ':')) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
        }

        return normalizedStr;
    }

    private void verifyFileAccess(Long userId, String filePath) {
        String[] segments = filePath.split("/");

        if (segments.length < 3) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
        }

        String prefix = segments[0];
        Long resourceId;
        try {
            resourceId = Long.parseLong(segments[1]);
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
        }

        switch (prefix) {
            case "users" -> {
                if (!resourceId.equals(userId)) {
                    throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
                }
            }
            case "stores" -> verifyStoreFileAccess(userId, resourceId, filePath);
            default -> throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    private void verifyStoreFileAccess(Long userId, Long storeId, String filePath) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if (store.getOwner().getId().equals(userId)) {
            return;
        }

        EmployeeDocument empDoc = employeeDocumentRepository.findByFileUrlWithEmployee(filePath)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED_USER));

        if (!empDoc.getEmployee().getStore().getId().equals(storeId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }

        if (!empDoc.getEmployee().getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }
    }
}
