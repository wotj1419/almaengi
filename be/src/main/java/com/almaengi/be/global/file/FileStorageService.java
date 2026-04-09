package com.almaengi.be.global.file;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    /**
     * 파일을 저장하고 상대경로를 반환한다.
     *
     * @param file         업로드된 파일
     * @param subDirectory 저장 하위 디렉토리 (예: "users/1", "stores/3")
     * @return 저장된 파일의 상대경로 (예: "users/1/uuid.pdf")
     */
    String store(MultipartFile file, String subDirectory);

    /**
     * 파일을 저장하고 상대경로를 반환한다 (문서 타입별 크기 제한 적용).
     *
     * @param file         업로드된 파일
     * @param subDirectory 저장 하위 디렉토리
     * @param docType      문서 유형 (크기 제한 조회용)
     * @return 저장된 파일의 상대경로
     */
    String store(MultipartFile file, String subDirectory, String docType);

    /**
     * 기존 파일을 대상 디렉토리로 물리적 복사하고 새 경로를 반환한다.
     *
     * @param sourcePath   원본 파일의 상대경로
     * @param targetSubDir 복사 대상 하위 디렉토리
     * @return 복사된 파일의 상대경로
     */
    String copy(String sourcePath, String targetSubDir);

    /**
     * 파일을 Resource로 로드한다 (다운로드용).
     *
     * @param filePath 파일의 상대경로
     * @return 파일 Resource
     */
    Resource loadAsResource(String filePath);

    /**
     * 파일을 삭제한다.
     *
     * @param filePath 파일의 상대경로
     */
    void delete(String filePath);
}
