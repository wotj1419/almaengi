import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Avatar from 'boring-avatars';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import { useChatStore, CURRENT_USER_ID } from '@/stores/useChatStore';
import type { ChatMessage } from '../types/chat';

const EMPTY_MESSAGES: ChatMessage[] = [];

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const roomId = Number(chatRoomId);
  const room = useChatStore((s) => s.rooms.find((r) => r.roomId === roomId));
  const storeMessages =
    useChatStore((s) => s.messages[roomId]) ?? EMPTY_MESSAGES;
  const addMessage = useChatStore((s) => s.addMessage);

  // DM이면 상대방 이름, 아니면 채팅방 이름
  const roomName =
    room?.roomType === 'DM'
      ? (room.otherUser?.name ?? '채팅')
      : (room?.name ?? '채팅');

  const avatarSeed = room?.otherUser?.name ?? roomName;

  const [messages, setMessages] = useState<ChatMessage[]>(storeMessages);
  const [input, setInput] = useState('');

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMsg: ChatMessage = {
      messageId: Date.now(),
      roomId,
      senderId: CURRENT_USER_ID,
      senderName: '사장님',
      messageType: 'TEXT',
      content: trimmed,
      fileUrl: null,
      sentAt: new Date().toISOString(),
      readCount: 0,
      isMine: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    addMessage(roomId, newMsg);
    setInput('');
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
    msgs: ChatMessage[];
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
      <DetailHeader title={roomName} onBack={() => navigate(ROUTES.STORE)} />

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

            {group.msgs.map((msg) => (
              <div
                key={msg.messageId}
                className={`flex mb-[var(--space-3)] ${msg.isMine ? 'justify-end' : 'justify-start'}`}
              >
                {/* 상대방: 아바타 */}
                {!msg.isMine && (
                  <div className="shrink-0 w-[36px] h-[36px] rounded-full overflow-hidden mr-[var(--space-2)] mt-[2px]">
                    <Avatar size={36} name={avatarSeed} variant="beam" />
                  </div>
                )}

                <div
                  className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'} max-w-[70%]`}
                >
                  {/* 상대방: 이름 */}
                  {!msg.isMine && (
                    <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)] mb-[2px]">
                      {msg.senderName}
                    </span>
                  )}

                  {/* 말풍선 */}
                  <div
                    className={`px-[var(--space-5)] py-[var(--space-3)] rounded-[var(--radius-lg)] text-[length:var(--text-base)] leading-[1.5] break-words ${
                      msg.isMine
                        ? 'bg-[var(--color-primary)] text-[color:var(--color-text-primary)]'
                        : 'bg-[var(--color-bg-white)] text-[color:var(--color-text-primary)]'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* 시간 */}
                  <span className="text-[length:11px] text-[color:var(--color-text-light)] mt-[3px]">
                    {formatTime(msg.sentAt)}
                  </span>
                </div>
              </div>
            ))}
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

        <div className="flex-1 flex items-center bg-[var(--color-bg-surface)] rounded-[var(--radius-xl)] pl-[var(--space-5)] pr-[4px] py-[4px]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요"
            className="flex-1 bg-transparent text-[length:var(--text-base)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-placeholder)] outline-none"
          />
          <button
            onClick={handleSend}
            className="shrink-0 px-[var(--space-7)] py-[var(--space-2)] rounded-full bg-[var(--color-primary)] text-[length:var(--text-base)] font-bold text-[color:var(--color-text-primary)] cursor-pointer"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
