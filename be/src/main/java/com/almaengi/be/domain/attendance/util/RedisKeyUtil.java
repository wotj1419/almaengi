package com.almaengi.be.domain.attendance.util;

/**
 * 출퇴근 도메인 전용 Redis key 생성 유틸리티입니다.
 * key 패턴을 한 곳에서 관리하여 오타·중복을 방지합니다.
 */
public class RedisKeyUtil {

    /** Redis 복구 완료를 나타내는 sentinel key */
    public static final String REDIS_READY_KEY = "attendance:redis:ready";

    private RedisKeyUtil() {}

    /**
     * 매장 근무중 직원 SET key.
     * 예: workingKey(1L) → "store:1:working"
     */
    public static String workingKey(Long storeId) {
        return "store:" + storeId + ":working";
    }

    /**
     * 매장 지각 직원 SET key.
     * 예: lateKey(1L) → "store:1:late"
     */
    public static String lateKey(Long storeId) {
        return "store:" + storeId + ":late";
    }

    /**
     * 매장 결근 직원 SET key.
     * 예: absentKey(1L) → "store:1:absent"
     */
    public static String absentKey(Long storeId) {
        return "store:" + storeId + ":absent";
    }

    /**
     * 상태 문자열로 key를 생성합니다.
     * 대시보드 상세 조회 전용이며, 호출 전 status 값 검증이 선행되어야 합니다.
     *
     * 예: storeKey(1L, "working") → "store:1:working"
     */
    public static String storeKey(Long storeId, String status) {
        return "store:" + storeId + ":" + status;
    }
}
