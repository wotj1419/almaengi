import Avatar from 'boring-avatars';
import { Pin } from 'lucide-react';
import type { RoomSummary } from '@/api/chat';

type Props = {
  room: RoomSummary;
  onClick: () => void;
};

/** 채팅방 목록에 표시할 이름 */
function getRoomDisplayName(room: RoomSummary): string {
  if (room.roomType === 'BOT') return room.name ?? '알맹이';
  return room.name ?? '채팅방';
}

/** 미리보기용 마크다운 기호 제거 */
function stripMarkdown(text: string | null): string | null {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s/gm, '');
}

/** 마지막 메시지 시각 포맷 */
function formatLastMessageTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${period} ${displayHour}:${minutes}`;
  }
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export default function ChatRoomCard({ room, onClick }: Props) {
  const displayName = getRoomDisplayName(room);

  return (
    <button
      className="flex items-center gap-[var(--space-5)] w-full px-[var(--space-7)] py-[var(--space-7)] bg-[var(--color-bg-white)] cursor-pointer text-left"
      onClick={onClick}
    >
      {/* 아바타 */}
      <div className="shrink-0 w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center bg-[var(--color-bg-surface)]">
        <Avatar size={52} name={displayName} variant="beam" />
      </div>

      {/* 이름 + 메시지 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[var(--space-2)]">
          <span className="text-[length:var(--text-ml)] font-bold text-[color:var(--color-text-primary)]">
            {displayName}
          </span>
          {room.roomType === 'BOT' && (
            <Pin
              size={14}
              color="var(--color-text-muted)"
              strokeWidth={2}
              fill="var(--color-text-muted)"
            />
          )}
          {room.memberCount > 2 && (
            <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-muted)]">
              {room.memberCount}
            </span>
          )}
        </div>
        <p className="text-[length:var(--text-base)] text-[color:var(--color-text-muted)] truncate mt-[2px]">
          {stripMarkdown(room.lastMessagePreview)}
        </p>
      </div>

      {/* 시간 + 안읽은 메시지 */}
      <div className="shrink-0 flex flex-col items-end gap-[var(--space-2)] self-start mt-[2px]">
        <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-light)]">
          {formatLastMessageTime(room.lastMessageAt)}
        </span>
        {room.unreadCount > 0 && (
          <span className="min-w-[20px] h-[20px] rounded-full bg-[var(--color-primary)] text-[color:var(--color-text-primary)] text-[length:11px] font-bold flex items-center justify-center px-[5px]">
            {room.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}
