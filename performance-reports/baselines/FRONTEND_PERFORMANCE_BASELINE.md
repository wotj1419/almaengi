# Frontend Performance Baseline

## 목적

이 문서는 Almaengi 프론트엔드의 `manualChunks` 적용 전후 성능 측정 기준과 원본 평균 수치를 기록한다.

이번 비교의 핵심은 Lighthouse 점수 개선 여부만 보는 것이 아니라, Vite build 결과에서 main app JS chunk가 어떻게 분리되었고 PWA precache 안정성에 어떤 영향을 주었는지 함께 확인하는 것이다.

## 비교 대상

| 항목 | 개선 전 Branch | 개선 후 Branch | 개선 내용 |
| --- | --- | --- | --- |
| chunk-splitting | `test-104-fe-performance-before` | `feat-104-fe-performance-measurement` | `node_modules`를 Vite `vendor` chunk로 분리 |

## 측정 환경

| 항목 | 값 |
| --- | --- |
| Deploy platform | Vercel Preview Deployment |
| Frontend root | `fe` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Measurement tool | Chrome DevTools Lighthouse |
| Mode | Navigation |
| Device | Mobile |
| Run count | 페이지별 3회 측정 후 평균 사용 |
| Backend API | 이번 측정에서는 연결하지 않음 |

## 측정 조건

기존 SSAFY backend deployment는 더 이상 사용할 수 없는 상태였기 때문에, API 의존도가 높은 로그인 이후 화면은 측정 대상에서 제외했다. 대신 public route인 `/`, `/login`, `/signup`을 대상으로 동일한 조건에서 개선 전후를 비교했다.

개선 전 branch에서는 `manualChunks`를 제거했다. 이때 단일 JavaScript asset이 Workbox의 기본 PWA precache 제한인 2MiB를 초과해 build가 실패했기 때문에, 측정을 위해서만 `workbox.maximumFileSizeToCacheInBytes`를 3MiB로 완화했다. 이 변경은 성능 개선이 아니라 개선 전 상태를 Vercel에 배포 가능하게 만들기 위한 측정 보조 설정이다.

## Build Output 기준 수치

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Main app JS chunk | 2,300.18 kB | 472.85 kB | -1,827.33 kB (-79.4%) |
| Main app JS gzip | 658.41 kB | 97.27 kB | -561.14 kB (-85.2%) |
| Largest JS asset | 2,300.18 kB | 2,017.01 kB | -283.17 kB (-12.3%) |

## Lighthouse Mobile 평균 수치

| Page | Timing | Performance | FCP | LCP | TBT | CLS | Speed Index | Total Bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | Before | 67.3 | 4.77s | 5.53s | 81ms | 0.000 | 4.77s | 3.04MiB |
| `/` | After | 61.7 | 5.09s | 8.85s | 127ms | 0.000 | 5.09s | 3.09MiB |
| `/login` | Before | 69.7 | 4.74s | 4.89s | 63ms | 0.000 | 4.74s | 2.92MiB |
| `/login` | After | 67.3 | 5.08s | 5.23s | 91ms | 0.000 | 5.08s | 2.97MiB |
| `/signup` | Before | 63.0 | 4.78s | 24.52s | 79ms | 0.000 | 4.78s | 4.70MiB |
| `/signup` | After | 61.3 | 5.08s | 23.41s | 105ms | 0.000 | 5.08s | 4.76MiB |

## 핵심 해석

`manualChunks` 적용으로 main app JS chunk는 2,300.18 kB에서 472.85 kB로 줄어 79.4% 감소했다. gzip 기준으로도 658.41 kB에서 97.27 kB로 85.2% 감소했다.

다만 이번 Vercel Preview 환경의 Lighthouse Mobile first-load 점수는 평균 66.7점에서 63.4점으로 낮아졌다. 따라서 이 작업은 "Lighthouse 점수 개선"으로 표현하면 안 된다.

정확한 성과는 bundle structure 개선, app code와 third-party dependency의 cache 분리, 그리고 Workbox PWA precache 기본 제한을 초과하던 대형 단일 JS asset 문제 해결이다.