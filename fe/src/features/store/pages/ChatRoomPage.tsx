import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Avatar from 'boring-avatars';
import { Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import useAuthStore from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import type { MessageItem } from '@/api/chat';
import { useChatSocket } from '@/stores/useChatSocket';

const EMPTY_MESSAGES: MessageItem[] = [];

/** 날짜 포맷: "오늘, 2026년 3월 18일" 또는 "2026년 3월 12일" */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  return isToday ? `오늘, ${label}` : label;
}

/** 시간 포맷: "오전 10:30" */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours < 12 ? '오전' : '오후';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${period} ${displayHour}:${minutes}`;
}

/** 날짜 키 (yyyy-MM-dd) */
function dateKey(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

export default function ChatRoomPage() {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const roomId = Number(chatRoomId);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const storeId = useAuthStore((s) => s.activeStoreId);
  const room = useChatStore((s) => s.rooms.find((r) => r.roomId === roomId));
  const messages = useChatStore((s) => s.messages[roomId]) ?? EMPTY_MESSAGES;
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const fetchMoreMessages = useChatStore((s) => s.fetchMoreMessages);
  const fetchRooms = useChatStore((s) => s.fetchRooms);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markAsRead = useChatStore((s) => s.markAsRead);
  const hasMore = useChatStore((s) => s.nextCursors[roomId] != null);

  const isBot = room?.roomType === 'BOT';
  const roomName = room?.name ?? '채팅';
  const avatarSeed = roomName;

  const [input, setInput] = useState('');
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const prevScrollHeightRef = useRef<number>(0);

  // WebSocket 연결 및 실시간 메시지 수신
  useChatSocket(roomId);

  // rooms가 로드되지 않은 경로로 직접 진입 시 fetchRooms 호출 (isBot 판별을 위해 필요)
  useEffect(() => {
    if (!room && storeId) fetchRooms(storeId);
  }, [room, storeId, fetchRooms]);

  // 방 입장 시 메시지 불러오기 + 읽음 처리
  useEffect(() => {
    fetchMessages(roomId).then(() => markAsRead(roomId));
  }, [roomId, fetchMessages, markAsRead]);

  // 새 메시지 수신/전송 시 스크롤 최하단으로 (이전 메시지 로딩 중엔 제외)
  useEffect(() => {
    if (isFetchingMore) return;
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isFetchingMore]);

  // 이전 메시지 로딩 후 스크롤 위치 보정
  useLayoutEffect(() => {
    if (!isFetchingMore || !scrollRef.current) return;
    const newScrollHeight = scrollRef.current.scrollHeight;
    scrollRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
  }, [messages, isFetchingMore]);

  // 스크롤이 맨 위에 닿으면 이전 메시지 추가 로딩
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = async () => {
      if (el.scrollTop !== 0 || !hasMore || isFetchingMore) return;
      prevScrollHeightRef.current = el.scrollHeight;
      setIsFetchingMore(true);
      await fetchMoreMessages(roomId);
      setIsFetchingMore(false);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [roomId, hasMore, isFetchingMore, fetchMoreMessages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput('');
    await sendMessage(roomId, trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 날짜별 그룹핑
  const groupedMessages: {
    date: string;
    label: string;
    msgs: MessageItem[];
  }[] = [];
  for (const msg of messages) {
    const dk = dateKey(msg.sentAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dk) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({
        date: dk,
        label: formatDateLabel(msg.sentAt),
        msgs: [msg],
      });
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-base)]">
      <DetailHeader
        title={roomName}
        onBack={() =>
          location.state?.from === 'home-direct'
            ? navigate(ROUTES.HOME)
            : navigate(`${ROUTES.STORE_COMMUNITY}?tab=chat`, {
                state: location.state,
              })
        }
      />

      {/* 메시지 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-[var(--space-5)] py-[var(--space-5)]"
      >
        {groupedMessages.map((group) => (
          <div key={group.date}>
            {/* 날짜 */}
            <div className="flex justify-center my-[var(--space-5)]">
              <span className="px-[var(--space-5)] py-[var(--space-1-5)] rounded-full bg-[var(--color-bg-base)] text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
                {group.label}
              </span>
            </div>

            {group.msgs.map((msg) => {
              const isMine = msg.senderId === userId;
              return (
                <div
                  key={msg.messageId}
                  className={`flex mb-[var(--space-3)] ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {/* 상대방: 아바타 */}
                  {!isMine && (
                    <div className="shrink-0 w-[36px] h-[36px] rounded-full overflow-hidden mr-[var(--space-2)] mt-[2px]">
                      <Avatar
                        size={36}
                        name={msg.senderName ?? avatarSeed}
                        variant="beam"
                      />
                    </div>
                  )}

                  <div
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}
                  >
                    {/* 상대방: 이름 */}
                    {!isMine && (
                      <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)] mb-[2px]">
                        {msg.senderName}
                      </span>
                    )}

                    {/* 말풍선 */}
                    <div
                      className={`px-[var(--space-5)] py-[var(--space-3)] rounded-[var(--radius-lg)] text-[length:var(--text-base)] leading-[1.5] break-words ${
                        isMine
                          ? 'bg-[var(--color-primary)] text-[color:var(--color-text-primary)]'
                          : 'bg-[var(--color-bg-white)] text-[color:var(--color-text-primary)]'
                      }`}
                    >
                      {isBot && !isMine ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-[var(--space-2)] last:mb-0">
                                {children}
                              </p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold">{children}</strong>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-[var(--space-5)] mb-[var(--space-2)]">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-[var(--space-5)] mb-[var(--space-2)]">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="mb-[2px]">{children}</li>
                            ),
                          }}
                        >
                          {msg.content ?? ''}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* 시간 */}
                    <span className="text-[length:11px] text-[color:var(--color-text-light)] mt-[3px]">
                      {formatTime(msg.sentAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 입력창 */}
      <div
        className="bg-[var(--color-bg-white)] border-t border-[var(--color-border-light)] flex items-center gap-[var(--space-3)] px-[var(--space-5)]"
        style={{
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          paddingTop: '12px',
        }}
      >
        <button className="shrink-0 w-[38px] h-[38px] rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center cursor-pointer">
          <Plus size={20} color="var(--color-text-muted)" strokeWidth={2} />
        </button>

        <div className="flex-1 min-w-0 flex items-center bg-[var(--color-bg-surface)] rounded-[var(--radius-xl)] pl-[var(--space-5)] pr-[4px] py-[4px]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요"
            className="flex-1 min-w-0 bg-transparent text-[length:var(--text-base)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-placeholder)] outline-none"
          />
          <button
            onClick={handleSend}
            className="shrink-0 px-[var(--space-5)] py-[var(--space-2)] rounded-full bg-[var(--color-primary)] text-[length:var(--text-base)] font-bold text-[color:var(--color-text-primary)] cursor-pointer"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
