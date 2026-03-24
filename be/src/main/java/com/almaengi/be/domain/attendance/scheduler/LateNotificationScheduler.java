package com.almaengi.be.domain.attendance.scheduler;

import com.almaengi.be.domain.notification.service.NotificationService;
import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

/**
 * 지각자 알림 스케줄러입니다.
 *
 * checkLate()가 :00, :30에 Redis late SET을 갱신한 뒤,
 * 10분 후(:10, :40)에 실행되어 사장님에게 FCM 푸시 알림을 1회 전송합니다.
 *
 * - 중복 방지: DB에 당일 동일 직원의 LATE 알림이 있으면 스킵
 * - 트랜잭션: 스케줄러 자체에 @Transactional 없음
 *   → store.getOwner() LAZY 문제는 findOpenStoresWithOwner() fetch join으로 해결
 *   → sendNotification()이 자체 @Transactional로 DB 저장 수행
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LateNotificationScheduler {

    private final StringRedisTemplate redisTemplate;
    private final StoreRepository storeRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final NotificationService notificationService;

    /**
     * checkLate() 10분 후 실행 — Redis late SET을 확인하여 사장님께 지각 알림 전송.
     * :10, :40에 실행되므로 checkLate()(:00, :30)와 순서 레이스가 없습니다.
     */
    @Scheduled(cron = "0 10,40 * * * *")
    public void checkAndNotifyLate() {
        // 운영 중 매장만 조회 (fetch join으로 owner 즉시 로딩)
        List<Store> stores = storeRepository.findOpenStoresWithOwner();

        for (Store store : stores) {
            // Redis에서 해당 매장의 지각자 ID 목록 조회
            Set<String> lateEmployeeIds = redisTemplate.opsForSet()
                    .members("store:" + store.getId() + ":late");

            if (lateEmployeeIds == null || lateEmployeeIds.isEmpty()) {
                continue;
            }

            // fetch join으로 이미 로딩된 상태 — LazyInitializationException 없음
            User owner = store.getOwner();

            for (String employeeIdStr : lateEmployeeIds) {
                Long employeeId = Long.parseLong(employeeIdStr);

                // 당일 중복 체크: 이미 같은 직원에 대한 LATE 알림을 보냈으면 스킵
                if (notificationService.isAlreadySentToday(
                        owner.getId(), NotificationType.LATE, employeeId)) {
                    continue;
                }

                String employeeName = getEmployeeName(employeeId);
                String title = "지각 알림";
                String body = employeeName + "님이 지각 중입니다. (" + store.getName() + ")";

                notificationService.sendNotification(
                        owner, NotificationType.LATE, title, body, employeeId);
            }
        }
    }

    /** StoreEmployee → User → name 조회. 직원이 삭제된 경우 "직원"으로 대체. */
    private String getEmployeeName(Long employeeId) {
        return storeEmployeeRepository.findByIdWithUser(employeeId)
                .map(emp -> emp.getUser().getName())
                .orElse("직원");
    }
}
