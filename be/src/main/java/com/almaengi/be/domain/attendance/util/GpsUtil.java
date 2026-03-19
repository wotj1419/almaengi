package com.almaengi.be.domain.attendance.util;

/**
 * GPS 좌표 간 거리를 Haversine 공식으로 계산하는 유틸리티입니다.
 *
 * - isWithinRange: 매장 반경 100m 이내 여부를 판정합니다.
 */
public class GpsUtil {

    private static final double EARTH_RADIUS_METERS = 6_371_000; // 지구 반경 (미터)
    private static final double MAX_DISTANCE_METERS = 100;       // 매장 허용 반경 (미터)

    private GpsUtil() {
    }

    /** 두 좌표 간 거리가 100m 이내인지 확인합니다. */
    public static boolean isWithinRange(double lat1, double lon1, double lat2, double lon2) {
        return calculateDistance(lat1, lon1, lat2, lon2) <= MAX_DISTANCE_METERS;
    }

    /** Haversine 공식으로 두 좌표 간 거리(미터)를 계산합니다. */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_METERS * c;
    }
}
