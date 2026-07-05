# Performance Reports

Almaengi ?꾨줎?몄뿏???깅뒫 痢≪젙 湲곗?, 媛쒖꽑 怨꾪쉷, 痢≪젙 ?먮낯, 理쒖쥌 寃곌낵瑜?紐⑥븘?먮뒗 ?대뜑?낅땲??

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
  媛쒖꽑 ??而ㅻ컠, 痢≪젙 URL, Lighthouse 湲곗?媛믪쓣 ?뺣━?⑸땲??

guides/
  Vercel Preview ?먮뒗 Nginx 諛고룷 ?섍꼍?먯꽌 ?깅뒫??痢≪젙?섎뒗 諛⑸쾿???뺣━?⑸땲??

measurements/
  Lighthouse JSON ?먮낯, ?ㅽ겕由곗꺑, ?ㅽ듃?뚰겕 罹≪쿂 ??痢≪젙 ?먮낯??蹂닿??⑸땲??

plans/
  ?대뼡 媛쒖꽑???대뼡 湲곗??쇰줈 寃利앺븷吏 怨꾪쉷???뺣━?⑸땲??

final/
  理쒖쥌 ?깅뒫 媛쒖꽑 寃곌낵? ?댁꽍???뺣━?⑸땲??
```

## Measurement Targets

```txt
chunk-splitting:
  9014e2a369455c048df5cd6e5bfc37a00bf59adf -> 814690e72d1398680a0d7bfa56a237538831d316

pwa-cache:
  22a55f644c4f7b39aae86181d1b5bc279b7478ba -> 2b6f1e9f756c6572bfaaf981423156019148219f
```

## Naming Rule

痢≪젙 寃곌낵 ?뚯씪? ?꾨옒 ?뺤떇?쇰줈 ??ν빀?덈떎.

```txt
lighthouse_<device>_<target>_<timing>.json
```

?덉떆:

```txt
lighthouse_mobile_chunk-splitting_before.json
lighthouse_mobile_chunk-splitting_after.json
lighthouse_desktop_pwa-cache_before.json
lighthouse_desktop_pwa-cache_after.json
```
