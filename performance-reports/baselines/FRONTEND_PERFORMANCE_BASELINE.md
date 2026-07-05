# Frontend Performance Baseline

## Purpose

This document records the raw baseline targets and measured before/after averages for the Almaengi frontend chunk-splitting comparison.

## Baseline Targets

| Target | Before Branch | After Branch | Improvement |
| --- | --- | --- | --- |
| chunk-splitting | `test-104-fe-performance-before` | `feat-104-fe-performance-measurement` | Split `node_modules` into a Vite `vendor` chunk |

## Measurement Environment

| Item | Value |
| --- | --- |
| Deploy platform | Vercel Preview Deployment |
| Frontend root | `fe` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Measurement tool | Chrome DevTools Lighthouse |
| Mode | Navigation |
| Device | Mobile |
| Run count | 3 runs per page, average used |
| Backend API | Not connected for this measurement |

## Measurement Notes

The original SSAFY backend deployment is no longer available, so API-dependent pages were excluded. The comparison focuses on public frontend routes.

The before branch removes `manualChunks`. Because the resulting single JavaScript file exceeded Workbox's default 2MiB precache limit, the before branch only relaxes `workbox.maximumFileSizeToCacheInBytes` to make the build deployable for measurement.

## Build Output Baseline

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Main app JS chunk | 2,300.18 kB | 472.85 kB | -1,827.33 kB (-79.4%) |
| Main app JS gzip | 658.41 kB | 97.27 kB | -561.14 kB (-85.2%) |
| Largest JS asset | 2,300.18 kB | 2,017.01 kB | -283.17 kB (-12.3%) |

## Lighthouse Mobile Average Metrics

| Page | Timing | Performance | FCP | LCP | TBT | CLS | Speed Index | Total Bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | Before | 67.3 | 4.77s | 5.53s | 81ms | 0.000 | 4.77s | 3.04MiB |
| `/` | After | 61.7 | 5.09s | 8.85s | 127ms | 0.000 | 5.09s | 3.09MiB |
| `/login` | Before | 69.7 | 4.74s | 4.89s | 63ms | 0.000 | 4.74s | 2.92MiB |
| `/login` | After | 67.3 | 5.08s | 5.23s | 91ms | 0.000 | 5.08s | 2.97MiB |
| `/signup` | Before | 63.0 | 4.78s | 24.52s | 79ms | 0.000 | 4.78s | 4.70MiB |
| `/signup` | After | 61.3 | 5.08s | 23.41s | 105ms | 0.000 | 5.08s | 4.76MiB |

## Key Takeaway

Manual chunk splitting reduced the main app JavaScript chunk by 79.4%, but it did not improve first-load Mobile Lighthouse scores in this measurement. The improvement should be described as bundle structure, cache separation, and PWA build stability improvement.
