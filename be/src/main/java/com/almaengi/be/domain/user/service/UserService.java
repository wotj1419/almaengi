package com.almaengi.be.domain.user.service;

import com.almaengi.be.domain.finance.dto.FinanceResponseDto;
import com.almaengi.be.domain.finance.service.SsafyFinanceService;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * 사용자 관련 비즈니스 로직을 담당합니다.
 * 금융망 API 호출은 SsafyFinanceService에 위임합니다.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SsafyFinanceService ssafyFinanceService;

    /**
     * SSAFY 금융망 계정을 생성합니다.
     * 금융망 API를 호출하여 사용자 계정을 등록합니다 (userKey는 DB에 저장하지 않음).
     */
    public void createFinanceAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        ssafyFinanceService.createMember(user.getEmail());
    }

    /**
     * SSAFY 금융망 계좌를 생성합니다.
     * 1. 금융망에서 userKey 조회 (미등록 시 에러)
     * 2. bankCode로 상품 조회 → accountTypeUniqueNo 획득
     * 3. 계좌 생성 API 호출 → accountNo 발급
     * 4. users 테이블에 accountNo, bankCode 저장
     */
    @Transactional
    public void createAccount(Long userId, String bankCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String userKey = ssafyFinanceService.searchMemberKey(user.getEmail());
        String accountTypeUniqueNo = ssafyFinanceService.getAccountTypeUniqueNo(bankCode);
        String[] result = ssafyFinanceService.createDemandDepositAccount(userKey, accountTypeUniqueNo);
        user.updateAccount(result[0], result[1]);
    }

    /**
     * 사용자 계좌에서 출금합니다. (시연용)
     */
    @Transactional(readOnly = true)
    public void withdraw(Long userId, Long amount, String summary) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getAccountNo() == null) {
            throw new BusinessException(ErrorCode.FINANCE_ACCOUNT_NOT_FOUND);
        }

        String userKey = ssafyFinanceService.searchMemberKey(user.getEmail());
        ssafyFinanceService.withdraw(userKey, user.getAccountNo(), amount, summary);
    }

    /**
     * 사용자 계좌에 입금합니다. (시연용)
     */
    @Transactional(readOnly = true)
    public void deposit(Long userId, Long amount, String summary) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getAccountNo() == null) {
            throw new BusinessException(ErrorCode.FINANCE_ACCOUNT_NOT_FOUND);
        }

        String userKey = ssafyFinanceService.searchMemberKey(user.getEmail());
        ssafyFinanceService.deposit(userKey, user.getAccountNo(), amount, summary);
    }

    /**
     * 사용자 계좌의 잔액을 조회합니다. (시연용)
     */
    @Transactional(readOnly = true)
    public Long getBalance(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getAccountNo() == null) {
            throw new BusinessException(ErrorCode.FINANCE_ACCOUNT_NOT_FOUND);
        }

        String userKey = ssafyFinanceService.searchMemberKey(user.getEmail());
        return ssafyFinanceService.inquireBalance(userKey, user.getAccountNo());
    }

    /**
     * 사용자 계좌의 거래내역을 조회합니다.
     * 금융망에서 userKey를 조회하고, accountNo가 등록되어 있어야 합니다.
     */
    @Transactional(readOnly = true)
    public List<FinanceResponseDto.TransactionHistory> getTransactionHistory(
            Long userId, String startDate, String endDate,
            String transactionType, String orderByType) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getAccountNo() == null) {
            throw new BusinessException(ErrorCode.FINANCE_ACCOUNT_NOT_FOUND);
        }

        String userKey = ssafyFinanceService.searchMemberKey(user.getEmail());

        List<Map<String, String>> transactions = ssafyFinanceService
                .inquireTransactionHistoryList(
                        userKey, user.getAccountNo(),
                        startDate, endDate, transactionType, orderByType);

        return transactions.stream()
                .map(FinanceResponseDto.TransactionHistory::from)
                .toList();
    }
}
