# Auction API Integration Changes

## Summary

- Owner용 auction 화면을 `AUCTION_API.md` 명세에 맞춰 프론트엔드 기준으로 정리했습니다.
- 개발 환경은 실제 API를 기본으로 사용하고, 필요할 때만 MSW를 켤 수 있게 변경했습니다.
- `storeId`는 이번 작업에서 기존 계획대로 `1` 하드코딩을 유지했습니다.

## Backend Change 여부

- 이번 작업에서 `be` 코드는 수정하지 않았습니다.
- 수정한 범위는 `fe` 내부 파일만입니다.
- 추가로 빌드 통과를 위해 `fe/src/features/todo/pages/TodoEditPage.tsx`의 기존 타입 오류 1건을 함께 수정했습니다.

## 주요 수정 파일

### API 타입 / 클라이언트

- `src/api/auction.types.ts`
  - `AuctionStatus`에 `CANCELLED` 추가
  - `createdAt` 수용
  - `AuctionDetailDto.bidders`를 `null` 가능하게 유지
  - `CloseAuctionResponse` 및 `winners` 타입 추가
- `src/api/auction.ts`
  - API 함수가 공통 응답 전체가 아니라 실제 `data`만 반환하도록 수정
  - `closeAuction`이 낙찰 결과 응답 타입을 사용하도록 변경
- `src/api/error.ts`
  - axios 에러 메시지를 토스트에 바로 연결하기 위한 유틸 추가

### React Query / 화면 연동

- `src/features/auction/hooks/useAuctionQueries.ts`
  - API 반환 구조 변경에 맞춰 쿼리/뮤테이션 정리
  - 성공 시 auction 관련 캐시를 전체 invalidate 하도록 수정
- `src/features/auction/pages/AuctionPage.tsx`
  - 경매 중단을 soft cancel 흐름으로 반영
  - 에러 메시지 토스트 처리 추가
- `src/features/auction/pages/AuctionDetailPage.tsx`
  - 낙찰 성공 시 서버 응답 `winners`를 결과 페이지로 전달
  - `recruitCount` 초과 선택 방지 유지
- `src/features/auction/pages/AuctionResultPage.tsx`
  - 서버 낙찰 응답 또는 상세 조회 fallback 기준으로 결과 표시
- `src/features/auction/pages/AuctionRegisterPage.tsx`
  - 명세 포맷(`YYYY-MM-DD`, `HH:mm:ss`, `YYYY-MM-DDTHH:mm:ss`) 기준으로 요청 생성
  - 마감 시간/근무 시간 선검증 정리
- `src/features/auction/pages/AuctionEditPage.tsx`
  - 수정 요청도 동일 포맷과 검증 기준으로 통일

### UI 매핑

- `src/features/auction/utils/auctionMapper.ts`
  - `IN_PROGRESS`, `CLOSED`, `CANCELLED`, 마감된 진행중 상태를 분리
  - 완료/중단/마감 라벨과 primary action 분기 추가
- `src/features/auction/components/AuctionItemCard.tsx`
  - 상태별 badge 스타일 및 primary action 구조 변경
- `src/features/auction/components/AuctionListCard.tsx`
  - 완료 탭 기준 렌더링 정리

### Mock / 개발 환경

- `src/mocks/handlers.ts`
  - mock 응답 shape를 API 명세 기준으로 정리
  - `DELETE /auctions/:auctionId`를 hard delete가 아니라 `CANCELLED` 처리로 변경
  - `POST /auctions/:auctionId/close`가 `winners` 포함 응답을 반환하도록 변경
  - `deadline > now`, `IN_PROGRESS` 상태 검증, `selectedBidIds <= recruitCount` 검증 추가
- `src/main.tsx`
  - `VITE_USE_MSW=true`일 때만 MSW 활성화
- `.env.example`
  - `VITE_USE_MSW=false` 추가
- `src/constants/config.ts`
  - `VITE_API_BASE_URL`만 사용하도록 통일

## 검증

- `pnpm build` 실행 완료
- 빌드 성공 확인

## 참고

- 실제 API를 붙이려면 `.env`에서 `VITE_API_BASE_URL`을 백엔드 주소로 맞추고,
  mock이 필요할 때만 `VITE_USE_MSW=true`로 켜면 됩니다.
