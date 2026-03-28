package com.almaengi.be.domain.contract.service;

import com.almaengi.be.domain.contract.dto.ContractRequestDto;
import com.almaengi.be.domain.contract.dto.ContractResponseDto;
import com.almaengi.be.domain.contract.entity.Contract;
import com.almaengi.be.domain.contract.repository.ContractRepository;
import com.almaengi.be.domain.contract.type.PaymentMethod;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.global.config.ContractProperties;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;


@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractService {

    private final ContractRepository contractRepository;
    private final StoreRepository storeRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final ContractPdfService contractPdfService;
    private final ContractProperties contractProperties;

    /**
     * 사장님이 특정 직원에 대한 근로계약서를 생성한다.
     */
    @Transactional
    public ContractResponseDto.ContractDetail createContract(Long userId, Long storeId, Long employeeId,
                                                             ContractRequestDto.Create request) {
        Store store = findStoreAndValidateOwner(storeId, userId);
        StoreEmployee storeEmployee = storeEmployeeRepository.findByIdWithUser(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));

        if (!storeEmployee.getStore().getId().equals(storeId)) {
            throw new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND);
        }

        // P1-8: 직원 상태 검증 (재직 중인 직원만 계약 가능)
        validateEmployeeStatus(storeEmployee);

        // P1-6: 비즈니스 검증
        validateContractDates(request);
        validateWorkTimes(request);

        // P1-9: 중복 계약 방지
        validateNoOverlappingContract(storeEmployee.getId(), request);

        String workplace = (request.getWorkplace() != null && !request.getWorkplace().isBlank())
                ? request.getWorkplace()
                : store.getAddress();

        PaymentMethod paymentMethod = PaymentMethod.BANK_TRANSFER;

        Contract contract = Contract.builder()
                .storeEmployee(storeEmployee)
                .contractStartDate(request.getContractStartDate())
                .contractEndDate(request.getContractEndDate())
                .workplace(workplace)
                .jobDescription(request.getJobDescription())
                .workStartTime(request.getWorkStartTime())
                .workEndTime(request.getWorkEndTime())
                .breakStartTime(request.getBreakStartTime())
                .breakEndTime(request.getBreakEndTime())
                .workDaysPerWeek(request.getWorkDaysPerWeek())
                .weeklyHoliday(request.getWeeklyHoliday())
                .wageType(request.getWageType())
                .wageAmount(request.getWageAmount())
                .hasBonus(request.getHasBonus())
                .bonusAmount(request.getBonusAmount())
                .hasOtherAllowance(request.getHasOtherAllowance())
                .otherAllowanceDetails(request.getOtherAllowanceDetails())
                .payDayDescription(request.getPayDayDescription())
                .paymentMethod(paymentMethod)
                .employmentInsurance(request.getEmploymentInsurance())
                .industrialAccidentInsurance(request.getIndustrialAccidentInsurance())
                .nationalPension(request.getNationalPension())
                .healthInsurance(request.getHealthInsurance())
                .contractDate(request.getContractDate())
                .employeeAddress(request.getEmployeeAddress())
                .build();

        Contract saved = contractRepository.save(contract);
        return ContractResponseDto.ContractDetail.from(saved);
    }

    /**
     * 사장님이 근로계약서에 서명한다.
     */
    @Transactional
    public ContractResponseDto.ContractDetail signByOwner(Long userId, Long storeId, Long contractId,
                                                          ContractRequestDto.Sign request) {
        findStoreAndValidateOwner(storeId, userId);
        Contract contract = findContractWithDetails(contractId, storeId);

        contract.signByOwner(request.getSignature());

        String pdfPath = generatePdfWithCleanup(contract);
        contract.updatePdfFilePath(pdfPath);

        return ContractResponseDto.ContractDetail.from(contract);
    }

    /**
     * 알바생이 근로계약서에 서명한다.
     */
    @Transactional
    public ContractResponseDto.ContractDetail signByEmployee(Long userId, Long storeId, Long contractId,
                                                              ContractRequestDto.Sign request) {
        Contract contract = findContractWithDetails(contractId, storeId);

        if (!contract.getStoreEmployee().getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.CONTRACT_ACCESS_DENIED);
        }

        contract.signByEmployee(request.getSignature());

        String pdfPath = generatePdfWithCleanup(contract);
        contract.updatePdfFilePath(pdfPath);

        return ContractResponseDto.ContractDetail.from(contract);
    }

    /**
     * 계약서 단건 상세 조회 (사장님 또는 해당 알바생)
     */
    public ContractResponseDto.ContractDetail getContract(Long userId, Long storeId, Long contractId) {
        Contract contract = findContractWithDetails(contractId, storeId);
        validateContractAccess(contract, userId);
        return ContractResponseDto.ContractDetail.from(contract);
    }

    /**
     * 매장의 전체 계약서 목록 조회 (사장님)
     */
    public List<ContractResponseDto.ContractSummary> getStoreContracts(Long userId, Long storeId) {
        findStoreAndValidateOwner(storeId, userId);
        List<Contract> contracts = contractRepository.findAllByStoreIdWithDetails(storeId);
        return contracts.stream()
                .map(ContractResponseDto.ContractSummary::from)
                .toList();
    }

    /**
     * 알바생의 내 계약서 목록 조회 (매장 스코프)
     */
    public List<ContractResponseDto.ContractSummary> getMyContracts(Long userId, Long storeId) {
        List<Contract> contracts = contractRepository.findAllByStoreIdAndUserIdWithDetails(storeId, userId);
        return contracts.stream()
                .map(ContractResponseDto.ContractSummary::from)
                .toList();
    }

    /**
     * 계약서 PDF 다운로드
     */
    public Resource downloadContractPdf(Long userId, Long storeId, Long contractId) {
        Contract contract = findContractWithDetails(contractId, storeId);
        validateContractAccess(contract, userId);

        if (contract.getPdfFilePath() == null) {
            throw new BusinessException(ErrorCode.CONTRACT_PDF_NOT_FOUND);
        }

        try {
            // Directory Traversal + symlink 방어
            Path filePath = Paths.get(contract.getPdfFilePath()).toRealPath();
            Path allowedBase = Paths.get(contractProperties.getStoragePath()).toRealPath();
            if (!filePath.startsWith(allowedBase)) {
                log.warn("PDF 경로 접근 거부: {} (허용 경로: {})", filePath, allowedBase);
                throw new BusinessException(ErrorCode.CONTRACT_PDF_NOT_FOUND);
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                throw new BusinessException(ErrorCode.CONTRACT_PDF_NOT_FOUND);
            }
            return resource;
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.CONTRACT_PDF_NOT_FOUND);
        }
    }

    // ─── Private Helpers ───

    /**
     * PDF 생성 후, 트랜잭션 롤백 시 orphan 파일을 자동 삭제한다.
     */
    private String generatePdfWithCleanup(Contract contract) {
        String pdfPath = contractPdfService.generatePdf(contract);

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        if (status == TransactionSynchronization.STATUS_ROLLED_BACK) {
                            try {
                                Files.deleteIfExists(Paths.get(pdfPath));
                                log.info("트랜잭션 롤백으로 PDF 파일 삭제: {}", pdfPath);
                            } catch (IOException e) {
                                log.warn("롤백 시 PDF 파일 삭제 실패: {}", pdfPath, e);
                            }
                        }
                    }
                });

        return pdfPath;
    }

    private Store findStoreAndValidateOwner(Long storeId, Long userId) {
        Store store = storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if (!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.CONTRACT_STORE_NOT_OWNED);
        }
        return store;
    }

    private Contract findContractWithDetails(Long contractId, Long storeId) {
        return contractRepository.findByIdAndStoreIdWithDetails(contractId, storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONTRACT_NOT_FOUND));
    }

    // P2-15: 미사용 storeId 파라미터 제거
    private void validateContractAccess(Contract contract, Long userId) {
        boolean isOwner = contract.getStoreEmployee().getStore().getOwner().getId().equals(userId);
        boolean isEmployee = contract.getStoreEmployee().getUser().getId().equals(userId);

        if (!isOwner && !isEmployee) {
            throw new BusinessException(ErrorCode.CONTRACT_ACCESS_DENIED);
        }
    }

    // P1-8: 직원 상태 검증
    private void validateEmployeeStatus(StoreEmployee storeEmployee) {
        StoreEmployeeStatus status = storeEmployee.getStatus();
        if (status == StoreEmployeeStatus.RESIGNED || status == StoreEmployeeStatus.INVITED || status == StoreEmployeeStatus.WAITING) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_EMPLOYEE);
        }
    }

    // P1-6: 계약 날짜 검증
    private void validateContractDates(ContractRequestDto.Create request) {
        if (request.getContractEndDate() != null
                && request.getContractEndDate().isBefore(request.getContractStartDate())) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_DATE);
        }
    }

    // P1-6: 근무시간/휴게시간 검증
    private void validateWorkTimes(ContractRequestDto.Create request) {
        // 근무시간 역전 방지
        if (!request.getWorkStartTime().isBefore(request.getWorkEndTime())) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_WORK_TIME);
        }

        boolean hasBreakStart = request.getBreakStartTime() != null;
        boolean hasBreakEnd = request.getBreakEndTime() != null;

        // 둘 다 null → 휴게시간 없음 (OK)
        if (!hasBreakStart && !hasBreakEnd) {
            return;
        }
        // 하나만 null → 잘못된 입력
        if (hasBreakStart != hasBreakEnd) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_WORK_TIME);
        }
        // 휴게시간 역전 방지
        if (!request.getBreakStartTime().isBefore(request.getBreakEndTime())) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_WORK_TIME);
        }
        // 휴게시간이 근무시간 범위 내인지
        if (request.getBreakStartTime().isBefore(request.getWorkStartTime())
                || request.getBreakEndTime().isAfter(request.getWorkEndTime())) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_WORK_TIME);
        }
    }

    // P1-9: 중복 계약 방지
    private void validateNoOverlappingContract(Long employeeId, ContractRequestDto.Create request) {
        if (request.getContractEndDate() == null) {
            // 무기계약: 이미 무기계약이 존재하는지 체크
            if (contractRepository.existsOpenEndedContract(employeeId)) {
                throw new BusinessException(ErrorCode.CONTRACT_PERIOD_OVERLAP);
            }
        } else {
            // 기간제: 기간 겹침 체크
            if (contractRepository.existsOverlappingContract(
                    employeeId, request.getContractStartDate(), request.getContractEndDate())) {
                throw new BusinessException(ErrorCode.CONTRACT_PERIOD_OVERLAP);
            }
        }
    }
}
