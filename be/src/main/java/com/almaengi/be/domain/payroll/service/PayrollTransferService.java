package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.finance.service.SsafyFinanceService;
import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.repository.PayrollRepository;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 급여 이체 비즈니스 로직을 담당합니다.
 * 스케줄러 또는 수동 이체 API에서 호출됩니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollTransferService {

    private final PayrollRepository payrollRepository;
    private final SsafyFinanceService ssafyFinanceService;

    /**
     * 매장 단위 급여 이체를 수행합니다. (스케줄러에서 @Async로 호출)
     * 1. 승인된 급여 조회
     * 2. 총 이체 금액 합산 → 잔액 확인
     * 3. 직원별 이체 실행
     *
     * @param store 매장 (owner가 fetch join된 상태)
     * @param targetMonth 정산 대상월 (1일로 정규화)
     */
    @Async
    @Transactional
    public void transferStorePayrollAsync(Store store, LocalDate targetMonth) {
        try {
            transferStorePayroll(store, targetMonth);
        } catch (Exception e) {
            log.error("[PayrollTransfer] 매장 {} 이체 실패 - {}", store.getName(), e.getMessage());
        }
    }

    /**
     * 매장 단위 급여 이체를 수행합니다. (수동 이체 API에서 동기 호출)
     *
     * @param store 매장 (owner가 fetch join된 상태)
     * @param targetMonth 정산 대상월 (1일로 정규화)
     */
    @Transactional
    public void transferStorePayroll(Store store, LocalDate targetMonth) {
        User owner = store.getOwner();

        // 1. 승인된 급여 조회 (fetch join으로 employee → user 로딩)
        List<Payroll> payrolls = payrollRepository
                .findApprovedByStoreIdAndTargetMonth(store.getId(), targetMonth);

        if (payrolls.isEmpty()) {
            log.info("[PayrollTransfer] 매장 {} - 이체 대상 급여 없음", store.getName());
            return;
        }

        // 이미 전부 이체 완료된 경우 스킵
        List<Payroll> pendingPayrolls = payrolls.stream()
                .filter(p -> !p.getIsTransferred())
                .toList();

        if (pendingPayrolls.isEmpty()) {
            log.info("[PayrollTransfer] 매장 {} - 모든 급여 이체 완료", store.getName());
            return;
        }

        // 2. 총 이체 금액 합산
        long totalAmount = pendingPayrolls.stream()
                .mapToLong(Payroll::getNetPay)
                .sum();

        // 3. 사장님 userKey 조회 (DB 미저장, API 호출)
        String ownerUserKey = ssafyFinanceService.searchMemberKey(owner.getEmail());

        // 4. 사장님 잔액 확인
        Long balance = ssafyFinanceService.inquireBalance(ownerUserKey, owner.getAccountNo());
        if (balance < totalAmount) {
            log.warn("[PayrollTransfer] 매장 {} - 잔액 부족 (잔액: {}, 필요: {})",
                    store.getName(), balance, totalAmount);
            throw new BusinessException(ErrorCode.TRANSFER_INSUFFICIENT_BALANCE);
        }

        // 5. 직원별 이체 실행
        int month = targetMonth.getMonthValue();
        for (Payroll payroll : pendingPayrolls) {
            User employee = payroll.getEmployee().getUser();
            String depositMemo = store.getName() + " " + month + "월 급여";
            String withdrawalMemo = employee.getName() + " " + month + "월 급여";

            try {
                ssafyFinanceService.transferDemandDeposit(
                        ownerUserKey,
                        owner.getAccountNo(),
                        employee.getAccountNo(),
                        payroll.getNetPay(),
                        withdrawalMemo,
                        depositMemo
                );
                payroll.completeTransfer();
                log.info("[PayrollTransfer] 이체 성공 - {} → {}, {}원",
                        store.getName(), employee.getName(), payroll.getNetPay());
            } catch (Exception e) {
                log.error("[PayrollTransfer] 이체 실패 - {} → {}, {}원: {}",
                        store.getName(), employee.getName(), payroll.getNetPay(), e.getMessage());
                throw new BusinessException(ErrorCode.TRANSFER_FAILED);
            }
        }

        log.info("[PayrollTransfer] 매장 {} 전체 이체 완료 - {}명, 총 {}원",
                store.getName(), pendingPayrolls.size(), totalAmount);
    }
}
