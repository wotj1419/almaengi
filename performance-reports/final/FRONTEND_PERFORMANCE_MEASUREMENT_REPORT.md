# Frontend Performance Measurement Report

## 요약

이 문서는 Almaengi 프론트엔드에 Vite `manualChunks`를 적용하기 전과 후를 비교한 성능 측정 결과다.

이번 작업은 first-load Lighthouse Mobile 점수를 직접 개선하지는 못했다. Vercel Preview 환경에서 측정한 결과, Lighthouse Mobile Performance 평균은 66.7점에서 63.4점으로 3.2점 낮아졌다.

대신 명확하게 수치화할 수 있는 개선 지점은 bundle structure다. 기존에는 app code와 third-party dependency가 하나의 큰 JavaScript entry chunk에 함께 포함되어 있었고, 개선 후에는 app chunk와 `vendor` chunk로 분리되었다. 그 결과 main app JS chunk 크기는 2,300.18 kB에서 472.85 kB로 79.4% 감소했다.

## 개선이 필요했던 이유

개선 전 build에서는 대부분의 app code와 `node_modules` dependency가 하나의 JavaScript entry chunk로 묶였다. 이 구조는 두 가지 문제가 있었다.

첫째, app code가 조금만 변경되어도 dependency code까지 같은 entry bundle의 cache invalidation 영향권에 들어간다. 즉, 브라우저가 장기적으로 cache할 수 있는 vendor code와 자주 변경되는 app code가 분리되지 않았다.

둘째, PWA precaching 관점에서도 문제가 있었다. `manualChunks`를 제거한 개선 전 상태에서는 단일 JavaScript asset이 2.3MB로 생성되었고, 이는 Workbox의 기본 precache 제한인 2MiB를 초과했다.

```txt
개선 전 build 문제:
assets/index-BG7G1KR1.js: 2,300.18 kB
Workbox default precache limit: 2 MiB
결과: 측정을 위해 제한을 완화하지 않으면 PWA precache build 실패
```

따라서 이 개선의 목적은 단순히 Lighthouse 점수를 올리는 것이 아니라, bundle을 app/vendor 기준으로 분리해 cache 효율과 build 안정성을 높이는 것이었다.

## 개선 방법

Vite build 설정에서 `rollupOptions.output.manualChunks`를 사용해 `node_modules`에 포함된 dependency를 별도의 `vendor` chunk로 분리했다.

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          return 'vendor';
        }
      },
    },
  },
}
```

이 설정을 통해 자주 변경되는 app code는 main app JS chunk에 남기고, 상대적으로 변경 빈도가 낮은 third-party dependency는 `vendor` chunk로 분리했다.

## Build Output 비교

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Main app JS chunk | 2,300.18 kB | 472.85 kB | -1,827.33 kB (-79.4%) |
| Main app JS gzip | 658.41 kB | 97.27 kB | -561.14 kB (-85.2%) |
| Vendor JS chunk | N/A | 2,017.01 kB | dependency cache 분리 |
| Vendor JS gzip | N/A | 620.84 kB | dependency cache 분리 |
| Largest JS asset | 2,300.18 kB | 2,017.01 kB | -283.17 kB (-12.3%) |
| PWA precache default limit | 2.3MB asset으로 실패 | split chunk 적용 후 통과 | build 안정성 개선 |

가장 큰 수치 변화는 main app JS chunk 크기다. 개선 전에는 2,300.18 kB의 단일 entry chunk였지만, 개선 후에는 app chunk가 472.85 kB로 분리되었다. gzip 기준으로도 658.41 kB에서 97.27 kB로 줄어 85.2% 감소했다.

다만 `vendor` chunk가 새로 분리되었기 때문에 전체 JavaScript 전송량이 극적으로 줄어든 것은 아니다. 이 작업의 의미는 전체 dependency를 없앤 것이 아니라, app code와 dependency code의 변경 단위와 cache 단위를 분리했다는 점에 있다.

## Lighthouse Mobile 측정 결과

Chrome DevTools Lighthouse Mobile mode에서 public route 3개를 각각 3회 측정하고 평균값을 사용했다.

### Performance Score

| Page | Before Perf | After Perf | Delta | 해석 |
| --- | ---: | ---: | ---: | --- |
| `/` | 67.3 | 61.7 | -5.7 (-8.4%) | 이번 측정에서는 하락 |
| `/login` | 69.7 | 67.3 | -2.3 (-3.3%) | 소폭 하락 |
| `/signup` | 63.0 | 61.3 | -1.7 (-2.6%) | 소폭 하락 |
| Average | 66.7 | 63.4 | -3.2 (-4.8%) | first-load score 개선 없음 |

### Core Metrics

| Page | Metric | Before | After | Delta |
| --- | --- | ---: | ---: | ---: |
| `/` | FCP | 4.77s | 5.09s | +0.31s (+6.5%) |
| `/` | LCP | 5.53s | 8.85s | +3.32s (+60.0%) |
| `/` | TBT | 81ms | 127ms | +47ms (+57.9%) |
| `/` | Total Bytes | 3.04MiB | 3.09MiB | +0.05MiB (+1.8%) |
| `/login` | FCP | 4.74s | 5.08s | +0.34s (+7.3%) |
| `/login` | LCP | 4.89s | 5.23s | +0.34s (+7.0%) |
| `/login` | TBT | 63ms | 91ms | +28ms (+45.2%) |
| `/login` | Total Bytes | 2.92MiB | 2.97MiB | +0.05MiB (+1.9%) |
| `/signup` | FCP | 4.78s | 5.08s | +0.29s (+6.2%) |
| `/signup` | LCP | 24.52s | 23.41s | -1.11s (-4.5%) |
| `/signup` | TBT | 79ms | 105ms | +26ms (+32.8%) |
| `/signup` | Total Bytes | 4.70MiB | 4.76MiB | +0.05MiB (+1.2%) |

## 결과 해석

이번 측정 결과를 "초기 로딩 성능이 좋아졌다"라고 표현하는 것은 정확하지 않다. Lighthouse Mobile 기준 first-load score는 평균 4.8% 하락했고, FCP와 TBT도 전반적으로 증가했다.

반면 bundle 구조 관점에서는 개선 효과가 명확하다. main app JS chunk가 79.4% 감소했고, app code와 third-party dependency가 서로 다른 chunk로 분리되었다. 이 구조에서는 app code가 변경되더라도 vendor dependency cache를 더 안정적으로 유지할 수 있다.

또한 개선 전 단일 JS asset은 Workbox PWA precache 기본 제한인 2MiB를 초과했지만, 개선 후에는 app chunk가 분리되면서 해당 문제가 해소되었다. 따라서 이 작업은 Lighthouse score 개선보다는 bundle architecture, cache strategy, PWA build stability 개선으로 정리하는 것이 맞다.

## 포트폴리오용 문장

### 짧은 버전

```txt
Vite manualChunks를 적용해 2.3MB 단일 entry JS를 app/vendor chunk로 분리하고, main app JS chunk를 472.85KB로 79.4% 축소했습니다. 이를 통해 app code와 third-party dependency cache를 분리하고, PWA precache 2MiB 제한을 초과하던 대형 bundle 문제를 해결했습니다.
```

### 상세 버전

```txt
React/Vite 기반 프론트엔드의 초기 bundle structure를 분석해 node_modules가 app entry bundle에 함께 포함되는 문제를 확인했습니다. Vite rollupOptions.manualChunks로 third-party dependency를 vendor chunk로 분리했고, 그 결과 main app JS chunk 크기를 2,300.18KB에서 472.85KB로 79.4% 줄였습니다. 또한 기존 단일 JS bundle이 Workbox PWA precache 기본 제한(2MiB)을 초과하던 문제를 해소해 배포 안정성과 장기 cache 효율을 개선했습니다. Lighthouse Mobile 기준 first-load score는 평균 66.7점에서 63.4점으로 개선되지 않아, 후속 과제로 route-level code splitting과 대형 image asset 최적화가 필요함을 도출했습니다.
```

## 자기소개서용 정리

성능 개선을 수치화하기 위해 개선 전후 branch를 분리하고, Vercel Preview Deployment 환경에서 동일한 public route를 Lighthouse Mobile mode로 3회씩 반복 측정했습니다. 측정 결과 first-load Lighthouse score는 개선되지 않았지만, build output 분석을 통해 main app JS chunk를 2,300.18 kB에서 472.85 kB로 79.4% 줄였고, PWA precache 2MiB 제한을 초과하던 단일 bundle 문제를 해결했습니다.

이 경험을 통해 단순히 성능 점수를 높이는 것보다, 어떤 지표가 실제 개선을 설명하는지 구분하는 과정이 중요하다는 것을 배웠습니다. Lighthouse score가 개선되지 않은 원인을 바탕으로 다음 최적화 과제를 route-level code splitting, image asset 최적화, repeat-visit cache 측정으로 구체화했습니다.

## 원본 측정 파일

```txt
performance-reports/measurements/before/chunk-splitting/lighthouse_mobile_landing_before_1.json
performance-reports/measurements/before/chunk-splitting/lighthouse_mobile_landing_before_2.json
performance-reports/measurements/before/chunk-splitting/lighthouse_mobile_landing_before_3.json
performance-reports/measurements/before/chunk-splitting/lighthouse_mobile_login_before_1.json
performance-reports/measurements/before/chunk-splitting/lighthouse_mobile_login_before_2.json
performance-reports/measurements/before/chunk-splitting/lighthouse_mobile_login_before_3.json
performance-reports/measurements/before/chunk-splitting/lighthouse_mobile_signup_before_1.json
performance-reports/measurements/before/chunk-splitting/lighthouse_mobile_signup_before_2.json
performance-reports/measurements/before/chunk-splitting/lighthouse_mobile_signup_before_3.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_landing_after_1.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_landing_after_2.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_landing_after_3.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_login_after_1.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_login_after_2.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_login_after_3.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_signup_after_1.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_signup_after_2.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_signup_after_3.json
```

## 후속 개선 과제

1. `React.lazy`와 `Suspense`를 활용한 route-level code splitting 적용
2. `stamp-paid`, `owner`, `worker` 등 대형 image asset 최적화
3. PWA service worker 기준 repeat-visit cache 성능 별도 측정
4. bundle visualizer를 활용해 `vendor` chunk 내부의 대형 dependency 분석