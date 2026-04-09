package com.almaengi.be.global.aop;

import com.almaengi.be.global.annotation.DistributedLock;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.util.CustomSpringELParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * @DistributedLock 이 붙은 메서드 전후로 동작하며,
 *                  실질적인 Redis 분산 락 획득(tryLock) 및 반환(unlock) 로직을 관장합니다.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class DistributedLockAop {

    private static final String REDISSON_LOCK_PREFIX = "LOCK:";
    private final RedissonClient redissonClient;

    // 타겟 메서드들(@DistributedLock이 붙은)이 실행되기 전후(@Around)로 가로채기를 수행합니다.
    @Around("@annotation(com.almaengi.be.global.annotation.DistributedLock)")
    public Object lock(final ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        DistributedLock distributedLock = method.getAnnotation(DistributedLock.class);

        // 1. SpEL 파서를 통해 동적으로 생성된 고유 Lock Key 값 추출 (예: LOCK:auction:3)
        String baseKey = REDISSON_LOCK_PREFIX + CustomSpringELParser.getDynamicValue(
                signature.getParameterNames(), joinPoint.getArgs(), distributedLock.key());

        // 2. Redisson Client를 사용하여 해당 Key를 제어할 RLock 객체 획득
        RLock rLock = redissonClient.getLock(baseKey);

        try {
            // 3. 지정된 waitTime 동안 Lock 획득 시도 (다른 스레드가 사용중이면 기다림)
            boolean available = rLock.tryLock(distributedLock.waitTime(), distributedLock.leaseTime(),
                    distributedLock.timeUnit());

            // 지정 시간 내에 락을 얻지 못하면, 시스템 보호를 위해 튕겨냅니다. (429 에러 대응용)
            if (!available) {
                log.warn("Redisson Lock 획득 시간 초과 실패 -> [key:{}]", baseKey);
                throw new BusinessException(ErrorCode.AUCTION_LOCK_TIMEOUT);
            }

            // 4. Lock 획득에 성공했다면, 원래 실행하려던 진짜 비즈니스 로직(입찰 등)을 수행합니다.
            return joinPoint.proceed();

        } catch (InterruptedException e) {
            // 스레드 인터럽트 방지 밑 비즈니스 예외 전환
            throw new BusinessException(ErrorCode.AUCTION_LOCK_INTERRUPTED);
        } finally {
            // 5. 비즈니스 로직 처리가 끝났다면 무조건! 락을 해제해야 합니다. (좀비 락 방지)
            try {
                // 현재 자신이 이 락을 쥐고 있는 상태일 때만 안전하게 해제합니다.
                if (rLock.isLocked() && rLock.isHeldByCurrentThread()) {
                    rLock.unlock();
                }
            } catch (IllegalMonitorStateException e) {
                log.info("Redisson Lock이 이미 반환되었거나 상태가 올바르지 않습니다. -> [key:{}]", baseKey);
            }
        }
    }
}
