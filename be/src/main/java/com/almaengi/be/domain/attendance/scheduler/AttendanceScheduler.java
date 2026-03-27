package com.almaengi.be.domain.attendance.scheduler;

import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import com.almaengi.be.domain.attendance.util.RedisKeyUtil;
import com.almaengi.be.domain.store.entity.WorkSchedule;
import com.almaengi.be.domain.store.repository.WorkScheduleRepository;
import com.almaengi.be.domain.store.type.DayOfWeek;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 출퇴근 자동 처리 스케줄러입니다.
 *
 * 네 가지 동작:
 * 1. 일일 배치 (매일 자정): 전일 Redis absent 초기화 + Attendance(WAITING) 사전 생성
 * 2. 30분 폴링 (매시 :00, :30): 지각 판정(WAITING→LATE), 퇴근시각 경과(ABSENT 또는 overtime)
 * 3. 서버 재시작 시: DB 기반 Redis 복구 (오늘+어제분)
 * 4. Redis 단독 장애 감지: sentinel key 소멸 시 30분 폴링에서 자동 복구
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AttendanceScheduler {

    private final AttendanceRepository attendanceRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final StoreRepository storeRepository;
    private final StringRedisTemplate redisTemplate;


    // ========== 1. 일일 배치 ==========

    /** 매일 자정 실행: 전일 Redis absent 초기화 + 오늘 요일 WorkSchedule 기반 Attendance(WAITING) 사전 생성 */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void dailyBatch() {
        log.info("[AttendanceScheduler] 일일 배치 시작");

        // 1. 전일 Redis absent 초기화
        clearAbsentKeys();

        // 2. 오늘 요일의 WorkSchedule 조회 (Java 1=월~7=일 → 커스텀 0=일~6=토)
        LocalDate today = LocalDate.now();
        DayOfWeek dayOfWeek = DayOfWeek.from(today.getDayOfWeek().getValue() % 7);
        List<WorkSchedule> schedules = workScheduleRepository.findByDayOfWeek(dayOfWeek);

        // 3. 기존 레코드 확인 (중복 방지)
        Set<Long> existingEmployeeIds = attendanceRepository.findByTargetDate(today).stream()
                .map(a -> a.getEmployee().getId())
                .collect(Collectors.toSet());

        // 4. Attendance(WAITING) 생성
        int created = 0;
        for (WorkSchedule schedule : schedules) {
            if (existingEmployeeIds.contains(schedule.getEmployee().getId())) {
                continue;
            }

            Attendance attendance = Attendance.builder()
                    .employee(schedule.getEmployee())
                    .targetDate(today)
                    .scheduledStartTime(schedule.getStartTime())
                    .scheduledEndTime(schedule.getEndTime())
                    .status(AttendanceStatus.WAITING)
                    .build();
            attendanceRepository.save(attendance);
            created++;
        }

        // 5. sentinel key 재설정
        redisTemplate.opsForValue().set(RedisKeyUtil.REDIS_READY_KEY, "true");

        log.info("[AttendanceScheduler] 일일 배치 완료 - {}건 생성", created);
    }

    // ========== 2. 서버 재시작 Redis 복구 ==========

    /**
     * 서버 기동 완료 시 DB 기반으로 Redis를 복구합니다.
     * 매장 단위로 삭제+추가를 연속 수행하여 빈 값 노출을 최소화합니다.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void rebuildRedisFromDb() {
        log.info("[AttendanceScheduler] Redis 복구 시작");

        // DB에서 오늘+어제 Attendance 조회
        LocalDate today = LocalDate.now();
        List<Attendance> allAttendances = new ArrayList<>();
        allAttendances.addAll(attendanceRepository.findByTargetDate(today));
        allAttendances.addAll(attendanceRepository.findByTargetDate(today.minusDays(1)));

        // 매장별로 그룹핑
        Map<Long, List<Attendance>> byStore = allAttendances.stream()
                .filter(a -> a.getClockOut() == null) // 퇴근 완료된 건 제외
                .collect(Collectors.groupingBy(a -> a.getEmployee().getStore().getId()));

        // 매장 단위로 삭제 → 즉시 추가 (빈 구간 최소화)
        Set<Long> allStoreIds = storeRepository.findByIsClosedFalse().stream()
                .map(Store::getId)
                .collect(Collectors.toSet());

        for (Long storeId : allStoreIds) {
            // 기존 키 삭제
            redisTemplate.delete(RedisKeyUtil.workingKey(storeId));
            redisTemplate.delete(RedisKeyUtil.lateKey(storeId));
            redisTemplate.delete(RedisKeyUtil.absentKey(storeId));

            // 해당 매장의 Attendance로 즉시 복구 (clockIn 유무 기반 분기)
            List<Attendance> storeAttendances = byStore.getOrDefault(storeId, List.of());
            for (Attendance attendance : storeAttendances) {
                String employeeIdStr = attendance.getEmployee().getId().toString();
                if (attendance.getClockIn() != null) {
                    // 출근한 상태 → 무조건 working (DB가 LATE여도 현재 근무 중)
                    redisTemplate.opsForSet().add(RedisKeyUtil.workingKey(storeId), employeeIdStr);
                } else if (attendance.getStatus() == AttendanceStatus.LATE) {
                    // 미출근 + LATE → 지각 미출근 상태
                    redisTemplate.opsForSet().add(RedisKeyUtil.lateKey(storeId), employeeIdStr);
                } else if (attendance.getStatus() == AttendanceStatus.ABSENT) {
                    redisTemplate.opsForSet().add(RedisKeyUtil.absentKey(storeId), employeeIdStr);
                }
            }
        }

        // sentinel key 설정
        redisTemplate.opsForValue().set(RedisKeyUtil.REDIS_READY_KEY, "true");

        log.info("[AttendanceScheduler] Redis 복구 완료");
    }

    // ========== 3. 30분 폴링 ==========

    /** 30분마다 실행: sentinel 체크 + 지각 판정 + 퇴근시각 경과 처리 */
    @Scheduled(cron = "0 0,30 * * * *")
    @Transactional
    public void statusCheck() {
        // Redis 장애 감지: sentinel key가 없으면 복구
        if (Boolean.FALSE.equals(redisTemplate.hasKey(RedisKeyUtil.REDIS_READY_KEY))) {
            log.warn("[AttendanceScheduler] Redis sentinel 없음 - 자동 복구 시작");
            rebuildRedisFromDb();
        }

        checkLate();
        checkEndTime();
    }

    /** 지각 판정: 출근시각 경과 + WAITING → LATE 전환 + Redis late 추가 */
    private void checkLate() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<Attendance> lateTargets = attendanceRepository
                .findByTargetDateAndStatusAndScheduledStartTimeLessThanEqual(
                        today, AttendanceStatus.WAITING, now);

        for (Attendance attendance : lateTargets) {
            attendance.updateStatus(AttendanceStatus.LATE);
            Long storeId = attendance.getEmployee().getStore().getId();
            redisTemplate.opsForSet().add(RedisKeyUtil.lateKey(storeId),
                    attendance.getEmployee().getId().toString());
        }

        if (!lateTargets.isEmpty()) {
            log.info("[AttendanceScheduler] 지각 판정: {}건", lateTargets.size());
        }
    }

    /** 퇴근시각 경과: 미출근→ABSENT, 근무중→overtime=true */
    private void checkEndTime() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<Attendance> endTimePassedTargets = attendanceRepository
                .findByTargetDateAndClockOutIsNullAndScheduledEndTimeLessThanEqualAndStatusNotAndOvertimeFalse(
                        today, now, AttendanceStatus.ABSENT);

        for (Attendance attendance : endTimePassedTargets) {
            Long storeId = attendance.getEmployee().getStore().getId();
            String employeeIdStr = attendance.getEmployee().getId().toString();

            if (attendance.getClockIn() == null) {
                attendance.updateStatus(AttendanceStatus.ABSENT);
                redisTemplate.opsForSet().add(RedisKeyUtil.absentKey(storeId), employeeIdStr);
                redisTemplate.opsForSet().remove(RedisKeyUtil.lateKey(storeId), employeeIdStr);
            } else {
                attendance.updateOvertime(true);
            }
        }

        if (!endTimePassedTargets.isEmpty()) {
            log.info("[AttendanceScheduler] 퇴근시각 경과: {}건", endTimePassedTargets.size());
        }
    }

    // ========== 유틸 ==========

    /** 전일 absent 키만 초기화 (working/late는 야간근무자 고려하여 유지) */
    private void clearAbsentKeys() {
        List<Store> stores = storeRepository.findByIsClosedFalse();
        for (Store store : stores) {
            redisTemplate.delete(RedisKeyUtil.absentKey(store.getId()));
        }
        log.info("[AttendanceScheduler] Redis absent 초기화 완료");
    }
}
