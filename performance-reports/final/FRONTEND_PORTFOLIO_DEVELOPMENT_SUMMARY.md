# Frontend Portfolio Development Summary

## 개요

이 문서는 Almaengi 프로젝트에서 담당한 프론트엔드 개발 내용을 포트폴리오와 자기소개서에 활용할 수 있도록 정리한 문서다.

정리 기준은 단순 기능 나열이 아니라, 각 작업을 다음 흐름으로 설명하는 것이다.

1. 왜 개발했는지
2. 어떻게 개발했는지
3. 그로 인한 성과가 무엇인지

수치가 포함된 항목은 실제 코드 구조와 재현 가능한 시나리오를 기준으로 작성했다.

## 1. FCM 알림 안정화

### 왜 개발했는지

알림 기능 구현 과정에서 로그인 직후, 새로고침, 다중 탭 환경에서 FCM token 발급이 중복 실행될 수 있는 문제가 있었다.

이 경우 브라우저 Push registration race, `TOO_MANY_REGISTRATIONS`, `AbortError`가 발생할 수 있고, 결과적으로 사용자가 알림을 안정적으로 수신하지 못할 가능성이 있었다.

따라서 FCM token 발급과 서버 동기화 과정을 안정화하고, 동일 token을 반복 등록하지 않도록 방어 로직을 추가할 필요가 있었다.

### 어떻게 개발했는지

FCM 전용 service worker를 등록하고, foreground message listener를 구성해 앱 실행 중에도 알림을 수신할 수 있도록 구현했다.

또한 `syncFcmToken` 과정에 다음 방어 로직을 적용했다.

| 방어 로직 | 목적 |
| --- | --- |
| `in-flight lock` | 같은 탭 안에서 동시에 들어온 token sync 요청을 하나의 Promise로 통합 |
| `cross-tab lock` | 여러 탭에서 동시에 `getToken`을 호출하는 상황 방지 |
| `cooldown` | 로그인 직후나 새로고침 직후 짧은 시간 안에 반복 호출되는 token sync 차단 |
| `hard failure cooldown` | `AbortError` 등 하드 실패 직후 재시도를 잠시 중단 |
| `AbortError retry` | 브라우저 Push 상태 이슈 발생 시 기존 token/subscription 정리 후 1회 재시도 |

동일 token을 서버에 반복 등록하지 않도록 마지막으로 동기화한 token과 시간을 `localStorage`에 저장했다. 알림 수신 이후에는 notification query invalidation, 알림 목록 조회, 단건/다건 읽음 처리, 알림 type별 route 이동까지 연결했다.

### 성과

동시 10회 token sync 호출 시나리오에서 `getToken` 실행을 최대 10회에서 1회로 제한할 수 있는 구조를 만들었다.

| 항목 | 개선 전 | 개선 후 | 결과 |
| --- | ---: | ---: | ---: |
| 동시 token sync 호출 시 `getToken` 실행 | 최대 10회 | 1회 | 90% 감소 |

### 포트폴리오 문장

```txt
FCM 알림 기능에서 로그인 직후/새로고침/다중 탭 환경의 token 중복 발급 문제를 방지하기 위해 in-flight lock, cross-tab lock, cooldown, AbortError retry를 적용했습니다. 동시 10회 token sync 호출 시 getToken 실행을 1회로 제한해 중복 호출을 90% 줄이고, 알림 수신 안정성을 개선했습니다.
```

## 2. WebSocket 기반 실시간 경매/채팅

### 왜 개발했는지

경매 상태와 채팅 메시지는 사용자 간 동기화가 중요한 기능이다.

경매 생성, 수정, 삭제, 마감 상태가 즉시 반영되지 않으면 사용자는 오래된 경매 정보를 기준으로 지원하거나 결과를 확인할 수 있다. 채팅 역시 메시지 전송 후 REST 응답과 WebSocket 수신이 겹치면 동일 메시지가 중복 렌더링될 수 있었다.

따라서 경매와 채팅을 polling이나 새로고침에 의존하지 않고, 이벤트 기반으로 최신 상태를 반영하는 구조가 필요했다.

### 어떻게 개발했는지

STOMP WebSocket을 사용해 경매 매장 채널과 채팅방 채널을 구독했다.

경매 기능에서는 `AUCTION_CREATED`, `AUCTION_UPDATED`, `AUCTION_DELETED`, `AUCTION_CLOSED` 이벤트를 수신하고, 이벤트의 `storeId`가 현재 매장과 일치하는지 검증한 뒤 React Query cache를 invalidation했다.

이를 통해 경매 목록과 상세 데이터가 이벤트 발생 시점에 다시 조회되도록 구성했다.

채팅 기능에서는 REST 응답으로 받은 메시지와 WebSocket으로 수신한 메시지가 같은 경우를 대비해 `messageId` 기준 deduplication을 적용했다. 동일한 `messageId`가 이미 store에 존재하면 추가하지 않고, 존재하지 않을 때만 메시지를 append하도록 처리했다.

### 성과

경매는 polling 없이 event 기반으로 상태 변경을 반영할 수 있는 구조가 되었다.

예를 들어 5초 polling으로 1분 동안 경매 상태를 확인하면 12회 요청이 필요하지만, WebSocket 구조에서는 실제 이벤트 발생 시점에만 cache invalidation과 refetch가 일어난다.

채팅에서는 동일 메시지 1건이 REST 응답과 WebSocket 수신으로 2번 렌더링되던 케이스를 1번으로 제한했다.

| 항목 | 개선 전 | 개선 후 | 결과 |
| --- | ---: | ---: | ---: |
| 동일 채팅 메시지 렌더링 | 2회 | 1회 | 50% 감소 |
| 1분간 5초 polling 기준 상태 확인 요청 | 12회 | 이벤트 발생 시점에만 갱신 | 불필요한 주기 요청 제거 |

### 포트폴리오 문장

```txt
STOMP WebSocket을 활용해 경매 생성/수정/삭제/마감 이벤트와 채팅 메시지를 실시간으로 반영했습니다. 경매 이벤트 수신 시 React Query cache를 invalidation해 최신 데이터를 갱신했고, 채팅은 messageId 기반 deduplication으로 REST 응답과 WebSocket 수신 간 중복 렌더링을 50% 줄였습니다.
```

## 3. API Module 분리와 Token Refresh Queue

### 왜 개발했는지

프로젝트 규모가 커지면서 인증, 매장, 급여, 알림, 채팅, 계약, 스케줄, 근태 등 API 호출이 여러 기능에 걸쳐 증가했다.

API 호출 로직이 화면에 흩어지면 기능별 변경 범위가 커지고, 인증 처리나 error handling 같은 공통 정책을 일관되게 적용하기 어렵다.

또한 accessToken이 만료된 상태에서 여러 API가 동시에 401을 받으면 `/auth/reissue` 요청이 중복 발생하거나, 사용자가 불필요하게 로그아웃되는 문제가 발생할 수 있었다.

### 어떻게 개발했는지

프론트엔드 API layer를 기능별 module로 분리하고, 공통 Axios instance에서 request/response interceptor를 관리했다.

request interceptor에서는 `localStorage`의 accessToken을 자동으로 `Authorization` header에 주입했다.

response interceptor에서는 401 응답이 발생했을 때 refresh token 기반으로 accessToken을 재발급하도록 처리했다. 이때 동시에 여러 요청이 401을 받는 경우를 대비해 `isRefreshing`과 `failedQueue`를 사용했다.

첫 번째 요청만 `/auth/reissue`를 수행하고, 나머지 요청은 queue에서 대기한다. 새 accessToken이 발급되면 queue에 쌓인 요청들이 같은 token으로 재시도된다. `_retry` flag를 사용해 재시도 후에도 401이 발생하는 경우 무한 루프를 방지하고 로그인 페이지로 이동하도록 처리했다.

### 성과

현재 프론트엔드 API layer는 기능별로 분리되어 있으며, 코드 기준 다음 규모를 가진다.

| 항목 | 수치 |
| --- | ---: |
| API module | 14개 |
| API endpoint reference | 79개 |

동시 10개 API가 401을 받는 시나리오에서 `/auth/reissue` 요청을 10회에서 1회로 제한할 수 있다.

| 항목 | 개선 전 | 개선 후 | 결과 |
| --- | ---: | ---: | ---: |
| 동시 401 상황의 `/auth/reissue` 요청 | 최대 10회 | 1회 | 90% 감소 |

### 포트폴리오 문장

```txt
프론트엔드 API layer를 14개 module로 분리하고, 79개 API endpoint를 기능 단위로 관리했습니다. Axios interceptor에 token refresh queue를 적용해 동시 401 발생 시 /auth/reissue 요청을 1회로 제한했고, 10개 API 동시 실패 시나리오 기준 중복 재발급 요청을 90% 줄였습니다.
```

## 4. 성능 개선 측정과 문서화

### 왜 개발했는지

프론트엔드 성능 개선을 포트폴리오에 작성하려면 단순히 "개선했다"라고 설명하는 것보다, 개선 전후를 같은 조건에서 측정하고 수치로 비교해야 했다.

또한 Lighthouse 점수, build output, PWA build 안정성은 서로 다른 성격의 지표이기 때문에, 어떤 지표가 실제 개선을 설명하는지 분리해서 정리할 필요가 있었다.

### 어떻게 개발했는지

개선 전 branch와 개선 후 branch를 분리하고, Vercel Preview Deployment 환경에서 동일 route를 측정했다.

측정 대상은 backend 의존도가 낮은 public route인 `/`, `/login`, `/signup`으로 정했다. 각 route를 Chrome DevTools Lighthouse Mobile mode에서 3회씩 측정하고 평균값을 사용했다.

또한 Vite `manualChunks` 적용 전후 build output을 비교해 app code와 third-party dependency가 어떻게 분리되었는지 분석했다.

### 성과

Vite `manualChunks` 적용으로 main app JS chunk가 크게 감소했다.

| 항목 | 개선 전 | 개선 후 | 결과 |
| --- | ---: | ---: | ---: |
| Main app JS chunk | 2,300.18 kB | 472.85 kB | 79.4% 감소 |
| Main app JS gzip | 658.41 kB | 97.27 kB | 85.2% 감소 |
| Largest JS asset | 2,300.18 kB | 2,017.01 kB | 12.3% 감소 |

다만 Lighthouse Mobile first-load score는 평균 66.7점에서 63.4점으로 개선되지 않았다.

따라서 이 작업은 "초기 로딩 점수 개선"이 아니라, bundle structure 개선, app code와 third-party dependency cache 분리, PWA build stability 개선으로 정리했다.

### 포트폴리오 문장

```txt
Vite manualChunks를 적용해 2.3MB 단일 entry JS를 app/vendor chunk로 분리하고, main app JS chunk를 472.85KB로 79.4% 축소했습니다. Lighthouse Mobile 측정 결과 first-load score는 개선되지 않았음을 확인하고, 성과를 bundle structure 개선과 PWA build stability 개선으로 분리해 문서화했습니다.
```

## 최종 요약

포트폴리오에서는 다음 4개를 핵심 성과로 묶는 것이 가장 좋다.

| 우선순위 | 핵심 개발 | 대표 수치 |
| ---: | --- | --- |
| 1 | FCM 알림 안정화 | 동시 token sync 중복 호출 90% 감소 |
| 2 | WebSocket 기반 실시간 경매/채팅 | 채팅 중복 렌더링 50% 감소 |
| 3 | API module 분리 + token refresh queue | 중복 reissue 요청 90% 감소 |
| 4 | 성능 개선 측정과 문서화 | main app JS chunk 79.4% 감소 |

가장 강한 표현은 "화면을 구현했다"가 아니라 "문제를 발견하고, 방어 구조를 설계하고, 재현 가능한 조건에서 수치로 개선했다"는 흐름이다.
