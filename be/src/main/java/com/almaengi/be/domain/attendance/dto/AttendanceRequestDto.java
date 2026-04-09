package com.almaengi.be.domain.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 출퇴근 QR 요청 DTO입니다.
 *
 * - qrToken: 매장 QR 코드에서 스캔한 토큰 (Store.qrCode와 매칭)
 * - latitude/longitude: 사용자 현재 GPS 좌표 (Haversine 100m 이내 검증)
 * - overtimeConfirm: 퇴근 시 clockOut > scheduledEndTime이면 필수 (true/false), 그 외 null 허용
 */
@Getter
@NoArgsConstructor
public class AttendanceRequestDto {

    @NotBlank(message = "QR 토큰은 필수입니다.")
    private String qrToken;

    @NotNull(message = "위도는 필수입니다.")
    private Double latitude;

    @NotNull(message = "경도는 필수입니다.")
    private Double longitude;

    /** 퇴근 시 연장근무 확인 여부 (출근 요청 시 null) */
    private Boolean overtimeConfirm;
}
