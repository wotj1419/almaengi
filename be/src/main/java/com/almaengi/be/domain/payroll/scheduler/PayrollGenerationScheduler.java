package com.almaengi.be.domain.payroll.scheduler;

import com.almaengi.be.domain.notification.service.NotificationService;
import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.payroll.service.PayrollService;
import com.almaengi.be.domain.payroll.service.PayslipService;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 급여 자동 정산 + 급여명세서 생성 스케줄러입니다.
 *
 * 매월 1일 04:00에 실행되어:
 * 1단계: 운영 중인 전 매장의 전월분 Payroll을 자동 생성합니다.
 * 2단계: 생성된 Payroll 기반으로 급여명세서 PDF를 생성합니다.
 *
 * 급여명세서는 이체 전 검토 도구로, 사장님/알바생이 확인 후
 * 근무기록 변경 요청 → 승인 → 급여 승인 → 이체 순으로 진행됩니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PayrollGenerationScheduler {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("M월");

    private final StoreRepository storeRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final PayrollService payrollService;
    private final PayslipService payslipService;
    private final NotificationService notificationService;

    /**
     * 매월 1일 04:00 실행: 전월분 급여 자동 정산 + 급여명세서 PDF 생성.
     */
    @Scheduled(cron = "0 0 4 1 * *")
    public void generateMonthlyPayrollsAndPayslips() {
        // 정산 대상월 = 전월 (1일로 정규화)
        LocalDate targetMonth = LocalDate.now().minusMonths(1).withDayOfMonth(1);

        // 운영 중 전 매장 조회 (fetch join owner)
        List<Store> stores = storeRepository.findAllActiveWithOwner();

        if (stores.isEmpty()) {
            log.info("[PayrollGenerationScheduler] 운영 중인 매장 없음");
            return;
        }

        log.info("[PayrollGenerationScheduler] 급여 자동 정산 시작 - 대상 매장: {}개, 산정월: {}",
                stores.size(), targetMonth);

        for (Store store : stores) {
            try {
                // 1단계: Payroll 자동 정산
                payrollService.generateStorePayrolls(
                        store.getOwner().getId(), store.getId(), targetMonth);

                // 2단계: 급여명세서 PDF 생성
                payslipService.generateStorePayslips(
                        store.getId(), targetMonth);

                // 3단계: 급여명세서 생성 알림 발송
                sendPayslipNotifications(store, targetMonth);

            } catch (Exception e) {
                log.error("[PayrollGenerationScheduler] 매장 처리 실패 - storeId: {}, storeName: {}",
                        store.getId(), store.getName(), e);
            }
        }

        log.info("[PayrollGenerationScheduler] 급여 자동 정산 완료 - 산정월: {}", targetMonth);
    }

    /**
     * 급여명세서 생성 후 사장님과 알바생에게 알림을 발송합니다.
     * 알림 실패가 급여명세서 생성에 영향을 주지 않도록
     * NotificationService.sendNotification()이 REQUIRES_NEW + 예외 삼키기를 사용합니다.
     */
    private void sendPayslipNotifications(Store store, LocalDate targetMonth) {
        String monthStr = targetMonth.format(MONTH_FORMATTER);

        // 사장님 알림
        try {
            notificationService.sendNotification(
                    store.getOwner(),
                    NotificationType.SALARY,
                    "급여명세서 생성 완료",
                    store.getName() + "의 " + monthStr + " 급여명세서가 생성되었습니다.",
                    store.getId()
            );
        } catch (Exception e) {
            log.warn("[PayrollGenerationScheduler] 사장님 알림 발송 실패 - storeId: {}", store.getId(), e);
        }

        // 알바생 알림
        List<StoreEmployee> employees = storeEmployeeRepository
                .findAllByStoreIdAndStatusWithUser(store.getId(), StoreEmployeeStatus.WORKING);

        for (StoreEmployee employee : employees) {
            try {
                notificationService.sendNotification(
                        employee.getUser(),
                        NotificationType.SALARY,
                        "급여명세서 확인",
                        monthStr + " 급여명세서가 도착했습니다.",
                        employee.getId()
                );
            } catch (Exception e) {
                log.warn("[PayrollGenerationScheduler] 알바생 알림 발송 실패 - employeeId: {}",
                        employee.getId(), e);
            }
        }
    }
}
