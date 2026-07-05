# Performance Reports

Almaengi 프론트엔드 성능 측정 기준, 개선 계획, 측정 원본, 최종 결과를 모아두는 폴더입니다.

## Folder Structure

```txt
performance-reports/
  README.md
  baselines/
    FRONTEND_PERFORMANCE_BASELINE.md
  guides/
    FRONTEND_DEPLOY_PERFORMANCE_GUIDE.md
  measurements/
    before/
      chunk-splitting/
      pwa-cache/
    after/
      chunk-splitting/
      pwa-cache/
  plans/
    FRONTEND_PERFORMANCE_MEASUREMENT_PLAN.md
  final/
    FRONTEND_PERFORMANCE_MEASUREMENT_REPORT.md
```

## Contents

```txt
baselines/
  측정 환경, before/after 기준, Lighthouse 평균값, build output 기준값을 정리합니다.

guides/
  Vercel Preview Deployment 기준 배포 설정과 측정 절차를 정리합니다.

measurements/
  Lighthouse JSON 원본 파일을 before/after 기준으로 보관합니다.

plans/
  어떤 개선을 어떤 기준으로 검증할지 측정 계획을 정리합니다.

final/
  최종 성능 비교 결과, 해석, 포트폴리오용 문장을 정리합니다.
```

## Measurement Targets

```txt
chunk-splitting:
  manualChunks 적용 전후의 bundle structure, cache separation, Lighthouse Mobile 지표를 비교합니다.

pwa-cache:
  service worker 적용 전후의 repeat visit cache 효과를 별도 측정 대상으로 둡니다.
```

## Naming Rule

측정 결과 파일은 아래 형식으로 저장합니다.

```txt
lighthouse_<device>_<page>_<timing>_<run>.json
```

예시:

```txt
lighthouse_mobile_landing_before_1.json
lighthouse_mobile_landing_after_1.json
lighthouse_mobile_login_before_1.json
lighthouse_mobile_signup_after_3.json
```
