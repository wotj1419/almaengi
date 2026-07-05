# Frontend Performance Baseline

## Purpose

?꾨줎?몄뿏???깅뒫 媛쒖꽑 ??湲곗?媛믪쓣 怨좎젙?섍퀬, ?댄썑 痢≪젙媛믨낵 鍮꾧탳?섍린 ?꾪븳 臾몄꽌?낅땲??

## Baseline Targets

| Target | Before Commit | After Commit | Improvement |
| --- | --- | --- | --- |
| chunk-splitting | `9014e2a369455c048df5cd6e5bfc37a00bf59adf` | `814690e72d1398680a0d7bfa56a237538831d316` | Vite manualChunks vendor 遺꾨━ |
| pwa-cache | `22a55f644c4f7b39aae86181d1b5bc279b7478ba` | `2b6f1e9f756c6572bfaaf981423156019148219f` | PWA service worker 諛??뺤쟻 ?먯궛 罹먯떛 |

## Measurement Environment

| Item | Value |
| --- | --- |
| Deploy platform | Vercel Preview Deployment |
| Frontend root | `fe` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Measurement tool | Chrome DevTools Lighthouse |
| Mode | Navigation |
| Run count | 3???댁긽 痢≪젙 ???됯퇏媛??ъ슜 |

## Target Pages

| Page | Reason |
| --- | --- |
| `/` | ?쒕뵫 諛?珥덇린 吏꾩엯 ?깅뒫 ?뺤씤 |
| `/login` | ?몄쬆 吏꾩엯 ?붾㈃ ?뺤씤 |
| `/home` | 濡쒓렇???댄썑 二쇱슂 ?붾㈃ ?뺤씤 |
| `/report` | 李⑦듃/由ы룷???붾㈃ ?깅뒫 ?뺤씤 |
| `/auction` | 寃쎈ℓ 湲곕뒫 ?붾㈃ ?깅뒫 ?뺤씤 |

## Baseline Metrics

| Page | Device | Performance | FCP | LCP | TBT | CLS | Speed Index | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | Mobile | TBD | TBD | TBD | TBD | TBD | TBD |  |
| `/` | Desktop | TBD | TBD | TBD | TBD | TBD | TBD |  |
