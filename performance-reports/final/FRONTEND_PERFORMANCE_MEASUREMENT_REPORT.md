# Frontend Performance Measurement Report

## Executive Summary

This measurement compares the Almaengi frontend before and after Vite manual chunk splitting.

The optimization did not improve first-load Lighthouse Mobile scores in this Vercel Preview test. The main measurable improvement is bundle structure: the single large entry JavaScript file was split into a smaller app entry chunk and a separate vendor chunk. This improves cacheability and prevents the app code from being coupled to third-party library cache invalidation.

## What Was Improved

### Problem

Before optimization, most application and third-party dependency code was emitted into one large JavaScript entry chunk. When PWA precaching was enabled, removing manual chunk splitting produced a 2.3MB JavaScript asset, which exceeded Workbox's default 2MiB precache limit.

```txt
Before build problem:
assets/index-BG7G1KR1.js: 2,300.18 kB
Workbox default precache limit: 2 MiB
Result: PWA precache build failed unless the limit was relaxed for measurement
```

### Change

The Vite build config was updated to split `node_modules` into a separate `vendor` chunk.

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

### Intended Effect

- Reduce the app entry chunk size.
- Separate frequently changing app code from less frequently changing dependency code.
- Improve long-term browser cache behavior for vendor code.
- Avoid PWA precache failures caused by a single oversized JavaScript asset.

## Build Output Comparison

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Main app JS chunk | 2,300.18 kB | 472.85 kB | -1,827.33 kB (-79.4%) |
| Main app JS gzip | 658.41 kB | 97.27 kB | -561.14 kB (-85.2%) |
| Vendor JS chunk | N/A | 2,017.01 kB | Separated dependency cache |
| Vendor JS gzip | N/A | 620.84 kB | Separated dependency cache |
| Largest JS asset | 2,300.18 kB | 2,017.01 kB | -283.17 kB (-12.3%) |
| PWA precache default limit | Failed at 2.3MB asset | Passed with split chunks | Build stability improved |

## Lighthouse Mobile Result

Each public route was measured 3 times in Chrome DevTools Lighthouse Mobile mode.

### Average Scores

| Page | Before Perf | After Perf | Delta | Result |
| --- | ---: | ---: | ---: | --- |
| `/` | 67.3 | 61.7 | -5.7 (-8.4%) | Worse in this run |
| `/login` | 69.7 | 67.3 | -2.3 (-3.3%) | Slightly worse |
| `/signup` | 63.0 | 61.3 | -1.7 (-2.6%) | Slightly worse |
| Average | 66.7 | 63.4 | -3.2 (-4.8%) | No first-load score gain |

### Average Core Metrics

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

## Interpretation

This optimization should not be presented as a first-load Lighthouse improvement. In the measured Vercel Preview environment, Mobile Lighthouse Performance decreased by 4.8% on average.

The stronger and more accurate portfolio claim is:

```txt
Reduced the main app JavaScript chunk from 2.3MB to 472.85KB (-79.4%) by splitting third-party dependencies into a vendor chunk, improving cache separation and resolving an oversized PWA precache asset issue.
```

This is a bundle architecture and caching improvement rather than a direct first-load rendering improvement. It makes future deploys more cache-friendly because app code changes no longer force the entire dependency bundle to be treated as part of the same entry chunk.

## Resume / Portfolio Wording

### Short Version

```txt
Vite manualChunks를 적용해 2.3MB 단일 엔트리 JS를 app/vendor 청크로 분리하고, 메인 앱 청크를 472.85KB로 79.4% 축소했습니다. 이를 통해 앱 코드와 외부 라이브러리 캐시를 분리하고, PWA precache 2MiB 제한을 초과하던 대형 번들 문제를 해결했습니다.
```

### Detailed Version

```txt
React/Vite 기반 프론트엔드의 초기 번들 구조를 분석해 node_modules가 앱 엔트리 번들에 함께 포함되는 문제를 확인했습니다. Vite rollupOptions.manualChunks로 외부 라이브러리를 vendor 청크로 분리했고, 그 결과 메인 앱 JS 청크 크기를 2,300.18KB에서 472.85KB로 79.4% 줄였습니다. 또한 기존 단일 JS 번들이 Workbox PWA precache 기본 제한(2MiB)을 초과하던 문제를 해소해 배포 안정성과 장기 캐시 효율을 개선했습니다. Lighthouse Mobile 기준 첫 로드 점수는 평균 66.7점에서 63.4점으로 개선되지 않아, 후속 과제로 라우트 단위 code splitting과 대형 이미지 최적화가 필요함을 도출했습니다.
```

## Raw Measurement Files

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

## Next Optimization Candidates

1. Add route-level lazy loading with `React.lazy` and `Suspense`.
2. Optimize large image assets such as `stamp-paid`, `owner`, and `worker`.
3. Measure repeat-visit cache behavior separately for the PWA service worker.
4. Add bundle visualizer output to identify the largest vendor modules.
