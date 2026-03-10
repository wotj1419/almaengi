package com.almaengi.be.global.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.concurrent.TimeUnit;

/**
 * 메서드 단위에 분산 락을 선언적으로 적용하기 위한 커스텀 어노테이션입니다.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DistributedLock {

    // 동적으로 Lock의 이름을 지어줄 SpEL(Spring Expression Language) 식
    // 예: "auction:1" -> #auctionId 와 같은 파라미터를 읽어오기 위함
    String key();

    // 락 획득을 위해 최대 대기할 시간 (단위: 초). 이 시간을 넘기면 에러(429) 반환
    long waitTime() default 3L;

    // 만약 락 해제가 정상적으로 이루어지지 않았을 때, Redis 스스로 안전하게 락을 반환할 시간 (좀비 락 방지)
    long leaseTime() default 2L;

    TimeUnit timeUnit() default TimeUnit.SECONDS;
}
