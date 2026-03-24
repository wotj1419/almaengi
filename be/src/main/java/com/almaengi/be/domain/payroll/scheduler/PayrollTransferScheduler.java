package com.almaengi.be.domain.payroll.scheduler;

import com.almaengi.be.domain.payroll.service.PayrollTransferService;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

/**
 * 급여 자동 이체 스케줄러입니다.
 * 매일 04시에 실행되어 오늘이 급여일인 매장의 승인된 급여를 자동 이체합니다.
 * 월말 보정: pay_day가 31인데 해당 월이 30일까지면 30일에 이체됩니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PayrollTransferScheduler {

    private final StoreRepository storeRepository;
    private final PayrollTransferService payrollTransferService;

    /**
     * 매일 04시 실행: 오늘이 급여일인 매장을 조회하여 급여를 자동 이체합니다.
     * 스케줄러는 급여일 당일만 동작하며, 실패 건은 수동 이체로 처리합니다.
     */
    @Scheduled(cron = "0 0 4 * * *")
    public void processPayrollTransfers() {
        LocalDate today = LocalDate.now();
        int todayDay = today.getDayOfMonth();
        int lastDayOfMonth = YearMonth.from(today).lengthOfMonth();

        // 월말 보정: 오늘이 월말이면 payDay가 오늘 이상인 매장도 포함
        List<Integer> payDays = buildPayDays(todayDay, lastDayOfMonth);

        List<Store> stores = storeRepository.findByPayDayInAndIsClosedFalse(payDays);

        if (stores.isEmpty()) {
            log.info("[PayrollTransferScheduler] 오늘({}) 급여일인 매장 없음", today);
            return;
        }

        // 정산 대상월 = 전월 (1일로 정규화)
        LocalDate targetMonth = today.minusMonths(1).withDayOfMonth(1);

        log.info("[PayrollTransferScheduler] 급여 자동 이체 시작 - 대상 매장: {}개, 산정월: {}",
                stores.size(), targetMonth);

        // 매장별 @Async 병렬 이체
        for (Store store : stores) {
            payrollTransferService.transferStorePayrollAsync(store, targetMonth);
        }
    }

    /**
     * 월말 보정을 포함한 급여일 목록을 생성합니다.
     * 오늘이 월말이면 payDay가 오늘 이상인 값도 포함합니다.
     * 예: 2월 28일(월말) → [28, 29, 30, 31]
     * 예: 3월 15일 → [15]
     */
    private List<Integer> buildPayDays(int todayDay, int lastDayOfMonth) {
        List<Integer> payDays = new ArrayList<>();
        payDays.add(todayDay);

        // 오늘이 월말이면 payDay가 오늘보다 큰 매장도 포함 (최대 31일)
        if (todayDay == lastDayOfMonth && lastDayOfMonth < 31) {
            for (int day = lastDayOfMonth + 1; day <= 31; day++) {
                payDays.add(day);
            }
        }

        return payDays;
    }
}
