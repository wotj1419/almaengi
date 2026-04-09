package com.almaengi.be.domain.attendance.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 대시보드 요약 응답 DTO입니다.
 * 매장의 근무중/지각/결근 직원 수를 반환합니다.
 * Redis SCARD로 조회하며 DB 접근이 없습니다.
 */
@Getter
@Builder
public class DashboardSummaryResponseDto {
    private Long working;
    private Long late;
    private Long absent;
}
