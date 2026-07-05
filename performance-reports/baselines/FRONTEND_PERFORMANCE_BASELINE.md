# Frontend Performance Baseline

## Purpose

This document records the baseline targets and measured values used for the Almaengi frontend performance comparison.

## Baseline Targets

| Target | Before Commit | After Commit | Improvement |
| --- | --- | --- | --- |
| chunk-splitting | `9014e2a369455c048df5cd6e5bfc37a00bf59adf` | `814690e72d1398680a0d7bfa56a237538831d316` | Split `node_modules` into a Vite `vendor` chunk |
| pwa-cache | `22a55f644c4f7b39aae86181d1b5bc279b7478ba` | `2b6f1e9f756c6572bfaaf981423156019148219f` | Add PWA service worker and static asset cache behavior |

## Measurement Environment

| Item | Value |
| --- | --- |
| Deploy platform | Vercel Preview Deployment |
| Frontend root | `fe` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Measurement tool | Chrome DevTools Lighthouse |
| Mode | Navigation |
| Run count | 3 runs per page, average used |
| Backend API | Not connected for this measurement |

## Target Pages

The first measurement pass focuses on public frontend routes because the original SSAFY backend deployment is no longer available.

| Page | Reason |
| --- | --- |
| `/` | Landing route and initial static asset loading |
| `/login` | Authentication entry route without API dependency |
| `/signup` | Signup entry route without requiring a completed backend flow |

## Current After Metrics

Current values are measured from the `feat-104-fe-performance-measurement` Vercel Preview deployment after adding the Vercel SPA rewrite.

| Page | Device | Runs | Performance | FCP | LCP | TBT | CLS | Speed Index | Total Bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | Mobile | 3 | 62 | 5.09s | 8.85s | 127ms | 0.000 | 5.09s | 3.09MiB |
| `/login` | Mobile | 3 | 67 | 5.08s | 5.23s | 91ms | 0.000 | 5.08s | 2.97MiB |
| `/signup` | Mobile | 3 | 61 | 5.08s | 23.41s | 105ms | 0.000 | 5.08s | 4.76MiB |

## Pending Measurements

| Target | Status |
| --- | --- |
| chunk-splitting before Mobile | Pending |
| chunk-splitting before Desktop | Pending |
| chunk-splitting after Desktop | Pending |
| pwa-cache before/after repeat visit | Pending |
