import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { useChatStore } from './useChatStore';
import type { MessageItem } from '@/api/chat';

/**
 * WebSocket(STOMP) 연결 및 채팅방 구독 훅
 *
 * 사용법:
 *   ChatRoomPage에서 useChatSocket(roomId) 호출
 *   → 컴포넌트 마운트 시 연결 + 구독
 *   → 언마운트 시 자동 해제
 */
export function useChatSocket(roomId: number) {
  const receiveMessage = useChatStore((s) => s.receiveMessage);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !roomId) return;

    const client = new Client({
      // Vite proxy가 /ws-chat → ws://localhost:8090/ws-chat 으로 중계
      brokerURL: `${import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8090'}/ws-chat`,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        // 채팅방 메시지 구독
        client.subscribe(`/sub/chat/rooms/${roomId}`, (frame) => {
          const message = JSON.parse(frame.body) as MessageItem;
          receiveMessage(roomId, message);
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [roomId, receiveMessage]);
}
