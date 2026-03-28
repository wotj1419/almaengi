package com.almaengi.be.global.file;

import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocalFileStorageService implements FileStorageService {

    private final FileStorageProperties properties;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".pdf", ".jpg", ".jpeg", ".png"
    );

    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(properties.getUploadDir());
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("업로드 디렉토리를 생성할 수 없습니다.", e);
        }
    }

    @Override
    public String store(MultipartFile file, String subDirectory) {
        return storeInternal(file, subDirectory, null);
    }

    @Override
    public String store(MultipartFile file, String subDirectory, String docType) {
        return storeInternal(file, subDirectory, docType);
    }

    private String storeInternal(MultipartFile file, String subDirectory, String docType) {
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.DOCUMENT_FILE_EMPTY);
        }

        String extension = extractExtension(file.getOriginalFilename()).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }

        long maxSize = properties.getMaxSizeForType(docType);
        if (file.getSize() > maxSize) {
            throw new BusinessException(ErrorCode.DOCUMENT_FILE_TOO_LARGE);
        }

        try {
            String storedFilename = UUID.randomUUID() + extension;
            Path targetDir = Paths.get(properties.getUploadDir(), subDirectory);
            validatePath(targetDir);
            Files.createDirectories(targetDir);

            Path targetPath = targetDir.resolve(storedFilename);
            validatePath(targetPath);
            file.transferTo(targetPath.toAbsolutePath().toFile());

            log.info("파일 저장 완료: {}", targetPath);
            return subDirectory + "/" + storedFilename;
        } catch (IOException e) {
            log.error("파일 저장 실패: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.DOCUMENT_UPLOAD_FAILED);
        }
    }

    @Override
    public String copy(String sourcePath, String targetSubDir) {
        try {
            Path source = Paths.get(properties.getUploadDir()).resolve(sourcePath);
            validatePath(source);
            if (!Files.exists(source)) {
                throw new BusinessException(ErrorCode.DOCUMENT_FILE_NOT_FOUND);
            }

            String extension = extractExtension(sourcePath);
            String newFilename = UUID.randomUUID() + extension;

            Path targetDir = Paths.get(properties.getUploadDir(), targetSubDir);
            validatePath(targetDir);
            Files.createDirectories(targetDir);

            Path target = targetDir.resolve(newFilename);
            validatePath(target);
            Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);

            log.info("파일 복사 완료: {} → {}", source, target);
            return targetSubDir + "/" + newFilename;
        } catch (IOException e) {
            log.error("파일 복사 실패: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.DOCUMENT_UPLOAD_FAILED);
        }
    }

    @Override
    public Resource loadAsResource(String filePath) {
        try {
            Path file = Paths.get(properties.getUploadDir()).resolve(filePath).normalize();
            validatePath(file);
            Resource resource = new UrlResource(file.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new BusinessException(ErrorCode.DOCUMENT_FILE_NOT_FOUND);
            }

            return resource;
        } catch (MalformedURLException e) {
            throw new BusinessException(ErrorCode.DOCUMENT_FILE_NOT_FOUND);
        }
    }

    @Override
    public void delete(String filePath) {
        try {
            Path file = Paths.get(properties.getUploadDir()).resolve(filePath);
            validatePath(file);
            Files.deleteIfExists(file);
            log.info("파일 삭제 완료: {}", file);
        } catch (IOException e) {
            log.warn("파일 삭제 실패: {}", e.getMessage(), e);
        }
    }

    private void validatePath(Path resolved) {
        Path normalized = resolved.normalize();
        Path uploadRoot = Paths.get(properties.getUploadDir()).normalize();
        if (!normalized.startsWith(uploadRoot)) {
            throw new BusinessException(ErrorCode.DOCUMENT_FILE_NOT_FOUND);
        }
    }

    private String extractExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return "";
    }
}
