# Frontend Performance Measurement Plan

## Goal

Almaengi ?꾨줎?몄뿏?쒖뿉???곸슜???깅뒫 愿??蹂寃쎌쓣 諛고룷 ?섍꼍?먯꽌 ?ы쁽 媛?ν븯寃?痢≪젙?섍퀬, 媛쒖꽑 ?꾪썑 ?섏튂瑜?臾몄꽌?뷀빀?덈떎.

## Scope

?대쾲 痢≪젙? ?꾨줎?몄뿏??媛쒖꽑 ?④낵瑜?遺꾨━?댁꽌 ?뺤씤?⑸땲?? ?꾩껜 ?댁쁺 ?섍꼍? Docker Compose? Nginx 湲곕컲?댁?留? 媛쒖꽑 ?꾪썑 鍮꾧탳???숈씪??Vercel Preview ?섍꼍?먯꽌 ?섑뻾?⑸땲??

## Measurement Items

### 1. Chunk Splitting

| Item | Value |
| --- | --- |
| Before | `9014e2a369455c048df5cd6e5bfc37a00bf59adf` |
| After | `814690e72d1398680a0d7bfa56a237538831d316` |
| Changed file | `fe/vite.config.ts` |
| Expected effect | vendor 泥?겕 遺꾨━濡?珥덇린 踰덈뱾 援ъ“? 罹먯떆 ?⑥쑉 媛쒖꽑 |

寃利???ぉ:

```txt
JS transferred size
main chunk size
vendor chunk size
Lighthouse Performance
FCP
LCP
TBT
Speed Index
```

### 2. PWA Cache

| Item | Value |
| --- | --- |
| Before | `22a55f644c4f7b39aae86181d1b5bc279b7478ba` |
| After | `2b6f1e9f756c6572bfaaf981423156019148219f` |
| Changed files | `fe/src/main.tsx`, `fe/vite.config.ts`, `fe/package.json`, PWA assets |
| Expected effect | service worker 湲곕컲 ?щ갑臾?罹먯떆 ?⑥쑉 媛쒖꽑 |

寃利???ぉ:

```txt
First visit transferred size
Repeat visit transferred size
Service worker registration
Cache Storage entries
Lighthouse PWA diagnostics
```

## Rules

1. before? after??媛숈? ?뚮옯?? 媛숈? 鍮뚮뱶 ?ㅼ젙, 媛숈? 痢≪젙 ?듭뀡?쇰줈 痢≪젙?⑸땲??
2. Lighthouse??Mobile怨?Desktop??媛곴컖 3???댁긽 ?ㅽ뻾?섍퀬 ?됯퇏媛믪쓣 湲곕줉?⑸땲??
3. 濡쒓렇???댄썑 ?붾㈃? 媛숈? 怨꾩젙, 媛숈? ?곗씠???곹깭?먯꽌 痢≪젙?⑸땲??
4. 痢≪젙 ?먮낯 JSON? `measurements/` ?섏쐞 ?대뜑??洹몃?濡?蹂닿??⑸땲??
5. ?댁꽍怨?寃곕줎? `final/FRONTEND_PERFORMANCE_MEASUREMENT_REPORT.md`???뺣━?⑸땲??
