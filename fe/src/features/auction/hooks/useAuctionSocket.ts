import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';

type AuctionWsEvent = {
  eventType:
    | 'AUCTION_CREATED'
    | 'AUCTION_UPDATED'
    | 'AUCTION_DELETED'
    | 'AUCTION_CLOSED';
  storeId: number;
  auctionId: number;
  occurredAt: string;
};

/**
 * 경매 매장 채널을 구독하고, 이벤트 수신 시 React Query 캐시를 무효화합니다.
 * - 목록/상세를 즉시 refetch 시켜 새로고침 없는 실시간 반영을 제공합니다.
 */
export function useAuctionSocket(storeId: number | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!storeId) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const wsBaseUrl =
      import.meta.env.VITE_WS_BASE_URL ??
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    const client = new Client({
      brokerURL: `${wsBaseUrl}/ws-chat`,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/sub/auctions/stores/${storeId}`, (frame) => {
          const event = JSON.parse(frame.body) as AuctionWsEvent;
          // 방어 코드: 다른 매장 이벤트는 무시
          if (event.storeId !== storeId) return;
          // 경매 목록 갱신
          queryClient.invalidateQueries({
            queryKey: ['auctions', 'list', storeId],
          });
          // 경매 상세 페이지도 열려 있을 수 있어 상세 캐시도 갱신
          if (typeof event.auctionId === 'number') {
            queryClient.invalidateQueries({
              queryKey: ['auctions', 'detail', event.auctionId],
            });
          }
        });
      },
      onWebSocketError: (e) => {
        console.error('[AUCTION-WS] socket error', e);
      },
      onStompError: (frame) => {
        console.error('[AUCTION-WS] stomp error', frame.headers, frame.body);
      },
    });
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [storeId, queryClient]);
}
