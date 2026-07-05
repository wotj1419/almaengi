# Frontend Deploy Performance Guide

## Vercel Preview Deployment

프론트엔드 성능 개선 전후를 비교할 때는 Vercel Preview Deployment를 사용합니다.

권장 설정:

```txt
Root Directory: fe
Framework Preset: Vite
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm build
Output Directory: dist
```

## Environment Variables

이번 1차 측정은 backend 없이 public route만 측정했기 때문에 Environment Variables를 비워둔 상태로 진행했습니다.

backend를 다시 배포하고 로그인 이후 페이지까지 측정할 경우에는 아래 값이 필요합니다.

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
1. before branch 배포
2. before URL 기록
3. `/`, `/login`, `/signup` 직접 접속 확인
4. Lighthouse Mobile 3회씩 측정
5. before JSON 원본 저장
6. after branch 배포
7. after URL 기록
8. 같은 route와 같은 조건으로 Lighthouse 재측정
9. 평균값과 delta 계산
10. final report에 결과와 해석 정리
```

## SPA Routing

Vercel에서 React Router deep link 새로고침이 404로 떨어지는 것을 막기 위해 `fe/vercel.json`에 SPA rewrite 설정을 추가했습니다.

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

기존 프로젝트의 실제 운영 구조는 루트 `docker-compose.yml`과 `nginx/default.conf`를 기준으로 합니다.

```txt
/api/      -> Spring Boot backend
/ws-chat   -> WebSocket backend
/          -> React SPA static files
/sw.js     -> no-store cache policy
workbox-*  -> immutable cache policy
```

이번 측정은 실제 운영 서버가 아니라 Vercel Preview 환경에서 프론트엔드 개선 효과만 분리 측정했습니다. 따라서 최종 문서에는 Vercel 측정 환경이라는 제한을 함께 기록합니다.
