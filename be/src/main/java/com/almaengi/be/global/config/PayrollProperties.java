package com.almaengi.be.global.config;

import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

/**
 * 급여 계산에 사용되는 설정값을 application.yml에서 바인딩합니다.
 * prefix "app.payroll" 하위의 모든 키를 자동 매핑합니다.
 * 앱 시작 시 @Validated에 의해 필드별 유효성이 자동 검증되고,
 * @PostConstruct에서 상·하한선 교차검증이 추가로 수행됩니다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.payroll")
@Validated
public class PayrollProperties {

    // ── 시간 기준 ──

    @NotBlank
    private String nightStart;                          // "22:00"

    @NotBlank
    private String nightEnd;                            // "06:00"

    @Min(1)
    private int overtimeDailyThresholdMinutes;          // 480  (8시간)

    @Min(1)
    private int overtimeWeeklyThresholdMinutes;         // 2400 (40시간)

    @Min(1)
    private int holidayPayWeeklyThresholdMinutes;       // 900  (15시간)

    // ── 3.3% 원천징수 세율 ──

    @DecimalMin(value = "0.0", inclusive = false)
    private double incomeTaxRate;                       // 0.03

    @DecimalMin(value = "0.0", inclusive = false)
    private double localIncomeTaxRate;                  // 0.003

    // ── 4대 보험 공제율 ──

    @DecimalMin(value = "0.0", inclusive = false)
    private double nationalPensionRate;                 // 0.0475

    @DecimalMin(value = "0.0", inclusive = false)
    private double healthInsuranceRate;                 // 0.03595

    @DecimalMin(value = "0.0", inclusive = false)
    private double longTermCareRate;                    // 0.1314

    @DecimalMin(value = "0.0", inclusive = false)
    private double employmentInsuranceRate;             // 0.009

    // ── 4대 보험 기준소득월액 상·하한선 ──

    @Min(0)
    private long nationalPensionMin;                    // 390000

    @Min(1)
    private long nationalPensionMax;                    // 6170000

    @Min(0)
    private long healthInsuranceMin;                    // 279300

    @Min(1)
    private long healthInsuranceMax;                    // 119625000

    /**
     * 상·하한선 교차검증: min > max이면 앱 시작 실패.
     * @Validated만으로는 필드 간 관계를 검증할 수 없으므로 @PostConstruct로 보완합니다.
     */
    @PostConstruct
    void validateBounds() {
        if (nationalPensionMin > nationalPensionMax) {
            throw new IllegalStateException(
                    "app.payroll.national-pension-min(" + nationalPensionMin +
                    ") > national-pension-max(" + nationalPensionMax + ")");
        }
        if (healthInsuranceMin > healthInsuranceMax) {
            throw new IllegalStateException(
                    "app.payroll.health-insurance-min(" + healthInsuranceMin +
                    ") > health-insurance-max(" + healthInsuranceMax + ")");
        }
    }
}
