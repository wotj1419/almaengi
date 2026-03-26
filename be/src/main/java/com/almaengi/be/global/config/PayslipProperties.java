package com.almaengi.be.global.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

/**
 * 급여명세서 생성에 사용되는 설정값을 application.yml에서 바인딩합니다.
 * prefix "app.payslip" 하위의 키를 자동 매핑합니다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.payslip")
@Validated
public class PayslipProperties {

    /** 급여명세서 PDF 저장 기본 경로 */
    @NotBlank
    private String storagePath;
}
