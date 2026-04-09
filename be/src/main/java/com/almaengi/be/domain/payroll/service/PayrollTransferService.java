package com.almaengi.be.domain.payroll.service;

import com.almaengi.be.domain.finance.service.SsafyFinanceService;
import com.almaengi.be.domain.notification.service.NotificationService;
import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.payroll.entity.Payroll;
import com.almaengi.be.domain.payroll.repository.PayrollRepository;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

/**
 * 급여 이체 비즈니스 로직을 담당합니다.
 * 스케줄러 또는 수동 이체 API에서 호출됩니다.
 *
 * 직원별 이체는 각각 독립 트랜잭션(REQUIRES_NEW)으로 실행되어,
 * 일부 직원 이체 실패 시에도 성공한 건은 롤백되지 않습니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollTransferService {

    private static final NumberFormat AMOUNT_FORMAT = NumberFormat.getNumberInstance(Locale.KOREA);

    private final PayrollRepository payrollRepository;
    private final SsafyFinanceService ssafyFinanceService;
    private final NotificationService notificationService;
    private final ObjectProvider<PayrollTransferService> selfProvider;

    /**
     * 매장 단위 급여 이체를 수행합니다. (스케줄러에서 @Async로 호출)
     *
     * @param store       매장 (owner가 fetch join된 상태)
     * @param targetMonth 정산 대상월 (1일로 정규화)
     */
    @Async
    public void transferStorePayrollAsync(Store store, LocalDate targetMonth) {
        try {
            transferStorePayroll(store, targetMonth);
        } catch (Exception e) {
            log.error("[PayrollTransfer] 매장 {} 이체 실패 - {}", store.getName(), e.getMessage());
        }
    }

    /**
     * 매장 단위 급여 일괄 이체를 수행합니다. (수동 이체 API에서 동기 호출)
     * 잔액 확인 후 직원별로 독립 트랜잭션에서 이체합니다.
     * 일부 실패 시에도 성공한 건은 커밋되며, 실패 건이 있으면 예외를 던집니다.
     *
     * @param store       매장 (owner가 fetch join된 상태)
     * @param targetMonth 정산 대상월 (1일로 정규화)
     */
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

        // 5. 직원별 독립 트랜잭션으로 이체 실행
        int month = targetMonth.getMonthValue();
        int failCount = 0;

        for (Payroll payroll : pendingPayrolls) {
            User employee = payroll.getEmployee().getUser();
            try {
                selfProvider.getObject().executeSingleTransfer(
                        payroll.getId(),
                        ownerUserKey,
                        owner.getAccountNo(),
                        employee.getAccountNo(),
                        payroll.getNetPay(),
                        store.getName(),
                        employee.getName(),
                        month
                );
                log.info("[PayrollTransfer] 이체 성공 - {} → {}, {}원",
                        store.getName(), employee.getName(), payroll.getNetPay());

                // 알바생에게 이체 완료 알림
                try {
                    notificationService.sendNotification(
                            employee,
                            NotificationType.SALARY,
                            "급여 입금 완료",
                            month + "월 급여 " + AMOUNT_FORMAT.format(payroll.getNetPay()) + "원이 입금되었습니다.",
                            payroll.getEmployee().getId()
                    );
                } catch (Exception ne) {
                    log.warn("[PayrollTransfer] 알바생 이체 알림 실패 - employeeId: {}", payroll.getEmployee().getId(), ne);
                }
            } catch (Exception e) {
                failCount++;
                log.error("[PayrollTransfer] 이체 실패 - {} → {}, {}원: {}",
                        store.getName(), employee.getName(), payroll.getNetPay(), e.getMessage());
            }
        }

        // 사장님에게 이체 결과 알림
        int successCount = pendingPayrolls.size() - failCount;
        try {
            String body = failCount == 0
                    ? store.getName() + " " + month + "월 급여 이체가 완료되었습니다. (" + successCount + "명, 총 " + AMOUNT_FORMAT.format(totalAmount) + "원)"
                    : store.getName() + " " + month + "월 급여 이체 중 " + failCount + "건 실패가 발생했습니다. (성공: " + successCount + "명)";
            notificationService.sendNotification(
                    owner,
                    NotificationType.SALARY,
                    failCount == 0 ? "급여 이체 완료" : "급여 이체 일부 실패",
                    body,
                    store.getId()
            );
        } catch (Exception e) {
            log.warn("[PayrollTransfer] 사장님 이체 알림 실패 - storeId: {}", store.getId(), e);
        }

        if (failCount > 0) {
            throw new BusinessException(ErrorCode.TRANSFER_FAILED);
        }

        log.info("[PayrollTransfer] 매장 {} 전체 이체 완료 - {}명, 총 {}원",
                store.getName(), pendingPayrolls.size(), totalAmount);
    }

    /**
     * 단일 직원 급여 이체를 독립 트랜잭션에서 수행합니다.
     * 금융망 API 호출 후 이체 완료 처리를 즉시 커밋하여,
     * 다른 직원의 이체 실패로 인한 롤백을 방지합니다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void executeSingleTransfer(Long payrollId, String ownerUserKey,
                                      String ownerAccountNo, String employeeAccountNo,
                                      long netPay, String storeName,
                                      String employeeName, int month) {

        String depositMemo = storeName + " " + month + "월 급여";
        String withdrawalMemo = employeeName + " " + month + "월 급여";

        ssafyFinanceService.transferDemandDeposit(
                ownerUserKey, ownerAccountNo, employeeAccountNo,
                netPay, withdrawalMemo, depositMemo
        );

        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYROLL_NOT_FOUND));
        payroll.completeTransfer();
    }
}
