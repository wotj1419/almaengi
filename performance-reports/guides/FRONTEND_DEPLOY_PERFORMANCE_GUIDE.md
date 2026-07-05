# Frontend Deploy Performance Guide

## Vercel Preview Deployment

?꾨줎?몄뿏???깅뒫 媛쒖꽑 ?꾪썑瑜?鍮꾧탳???뚮뒗 Vercel Preview Deployment瑜??ъ슜?⑸땲??

沅뚯옣 ?ㅼ젙:

```txt
Root Directory: fe
Framework Preset: Vite
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm build
Output Directory: dist
```

?꾩슂???섍꼍 蹂??

```txt
VITE_API_BASE_URL=https://<backend-domain>
VITE_WS_BASE_URL=wss://<backend-domain>
VITE_KAKAO_MAP_KEY=<key>
VITE_FIREBASE_API_KEY=<key>
VITE_FIREBASE_AUTH_DOMAIN=<value>
VITE_FIREBASE_PROJECT_ID=<value>
VITE_FIREBASE_STORAGE_BUCKET=<value>
VITE_FIREBASE_MESSAGING_SENDER_ID=<value>
VITE_FIREBASE_APP_ID=<value>
VITE_FIREBASE_VAPID_KEY=<key>
```

## Measurement Flow

```txt
1. before commit 諛고룷
2. before URL 湲곕줉
3. Lighthouse Mobile/Desktop 3???댁긽 痢≪젙
4. JSON ?먮낯 ???5. after commit 諛고룷
6. after URL 湲곕줉
7. 媛숈? 議곌굔?쇰줈 Lighthouse ?ъ륫??8. 寃곌낵 ?됯퇏媛?鍮꾧탳
```

## SPA Routing

Vercel?먯꽌 React Router deep link ?덈줈怨좎묠??源⑥쭏 寃쎌슦 `fe/vercel.json`??SPA rewrite ?ㅼ젙??異붽??⑸땲??

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Nginx Production Reference

?ㅼ젣 ?쒕퉬??援ъ“??猷⑦듃 `docker-compose.yml`怨?`nginx/default.conf`瑜?湲곗??쇰줈 ?⑸땲??

```txt
/api/      -> Spring Boot backend
/ws-chat   -> WebSocket backend
/          -> React SPA static files
/sw.js     -> no-store cache policy
workbox-*  -> immutable cache policy
```

理쒖쥌 蹂닿퀬?쒖뿉??Vercel 痢≪젙 寃곌낵? ?ㅼ젣 Nginx ?댁쁺 援ъ“??李⑥씠瑜??④퍡 湲곕줉?⑸땲??
