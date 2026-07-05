# Frontend Performance Measurement Plan

## Goal

Almaengi 프론트엔드에서 적용한 성능 개선 항목을 배포 환경에서 측정하고, before/after 수치를 포트폴리오에 활용할 수 있는 형태로 정리합니다.

## Scope

1차 측정은 Vercel Preview Deployment 환경에서 프론트엔드 정적 리소스와 bundle structure 개선 효과를 분리해서 확인합니다.

기존 SSAFY backend domain은 더 이상 사용할 수 없기 때문에 API 의존도가 높은 로그인 이후 페이지는 이번 측정 범위에서 제외했습니다. 대신 `/`, `/login`, `/signup`처럼 backend 없이도 렌더링 가능한 public route를 대상으로 측정했습니다.

## Measurement Items

### 1. Chunk Splitting

| Item | Value |
| --- | --- |
| Before branch | `test-104-fe-performance-before` |
| After branch | `feat-104-fe-performance-measurement` |
| Changed file | `fe/vite.config.ts` |
| Main change | Vite `manualChunks`로 `node_modules`를 `vendor` chunk로 분리 |
| Expected effect | app code와 third-party dependency code를 분리해 bundle structure와 cache separation 개선 |

측정 지표:

```txt
Build output chunk size
Main app JS chunk size
Vendor JS chunk size
Lighthouse Performance
FCP
LCP
TBT
CLS
Speed Index
Total byte weight
```

### 2. PWA Cache

| Item | Value |
| --- | --- |
| Before | `22a55f644c4f7b39aae86181d1b5bc279b7478ba` |
| After | `2b6f1e9f756c6572bfaaf981423156019148219f` |
| Changed files | `fe/src/main.tsx`, `fe/vite.config.ts`, `fe/package.json`, PWA assets |
| Expected effect | service worker 기반 repeat visit cache 효율 개선 |

측정 지표:

```txt
First visit transferred size
Repeat visit transferred size
Service worker registration
Cache Storage entries
Lighthouse PWA diagnostics
```

## Target Routes

| Route | Included | Reason |
| --- | --- | --- |
| `/` | Yes | public landing route이며 초기 정적 리소스 로딩을 확인할 수 있음 |
| `/login` | Yes | API 호출 없이 렌더링 가능한 auth entry route |
| `/signup` | Yes | backend 없이 진입 가능한 signup entry route |
| `/home` | No | backend/auth state 필요 |
| `/report` | No | backend/auth state 필요 |
| `/auction` | No | backend/auth state 필요 |

## Measurement Rules

1. before와 after는 같은 Vercel project setting으로 측정합니다.
2. React Router deep link가 깨지지 않도록 같은 SPA rewrite 설정을 사용합니다.
3. Lighthouse Mobile을 route별 3회 실행하고 평균값을 사용합니다.
4. Lighthouse JSON 원본은 `measurements/` 하위 폴더에 보관합니다.
5. 최종 해석과 포트폴리오용 문장은 `final/FRONTEND_PERFORMANCE_MEASUREMENT_REPORT.md`에 정리합니다.

## Important Note

이번 측정에서 Lighthouse first-load score는 개선되지 않았습니다. 따라서 성과를 설명할 때는 `Lighthouse 점수 개선`이 아니라 `main app JS chunk 축소`, `vendor chunk 분리`, `PWA precache limit 초과 문제 해결`, `cache separation 개선`으로 표현합니다.
