# Frontend Performance Measurement Plan

## Goal

Measure and document the performance impact of frontend changes in the Almaengi project.

## Scope

The first measurement pass isolates frontend behavior on Vercel Preview. Because the original SSAFY backend domain is no longer available, API-dependent pages are excluded from the initial comparison.

## Measurement Items

### 1. Chunk Splitting

| Item | Value |
| --- | --- |
| Before | `9014e2a369455c048df5cd6e5bfc37a00bf59adf` |
| After | `814690e72d1398680a0d7bfa56a237538831d316` |
| Changed file | `fe/vite.config.ts` |
| Expected effect | Improve bundle structure and cache efficiency by splitting `node_modules` into a `vendor` chunk |

Metrics:

```txt
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
| Expected effect | Improve repeat-visit loading through service worker caching |

Metrics:

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
| `/` | Yes | Public landing route |
| `/login` | Yes | Public auth entry route |
| `/signup` | Yes | Public signup entry route |
| `/home` | No | Requires backend/auth state |
| `/report` | No | Requires backend/auth state |
| `/auction` | No | Requires backend/auth state |

## Rules

1. Measure before and after with the same Vercel project settings.
2. Use the same SPA rewrite behavior for both before and after deployments.
3. Run Lighthouse Mobile 3 times per route and use the average.
4. Save raw Lighthouse JSON files under `measurements/`.
5. Record interpretation and deltas in `final/FRONTEND_PERFORMANCE_MEASUREMENT_REPORT.md`.
