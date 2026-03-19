import Avatar from 'boring-avatars';
import { Pin } from 'lucide-react';
import type { ChatRoom } from '../types/chat';

type Props = {
  room: ChatRoom;
  onClick: () => void;
};

/** 채팅방 목록에 표시할 이름 */
function getRoomDisplayName(room: ChatRoom): string {
  if (room.roomType === 'CHATBOT') return room.name ?? '알맹이';
  return room.otherUser?.name ?? room.name ?? '채팅방';
}

export default function ChatRoomCard({ room, onClick }: Props) {
  const displayName = getRoomDisplayName(room);
  const avatarSeed = room.otherUser?.name ?? displayName;

  return (
    <button
      className="flex items-center gap-[var(--space-5)] w-full px-[var(--space-7)] py-[var(--space-7)] bg-[var(--color-bg-white)] cursor-pointer text-left"
      onClick={onClick}
    >
      {/* 아바타 */}
      <div className="shrink-0 w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center bg-[var(--color-bg-surface)]">
        <Avatar size={52} name={avatarSeed} variant="beam" />
      </div>

      {/* 이름 + 메시지 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[var(--space-2)]">
          <span className="text-[length:var(--text-ml)] font-bold text-[color:var(--color-text-primary)]">
            {displayName}
          </span>
          {room.roomType === 'CHATBOT' && (
            <Pin
              size={14}
              color="var(--color-text-muted)"
              strokeWidth={2}
              fill="var(--color-text-muted)"
            />
          )}
          {room.otherUser?.position && (
            <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-muted)]">
              {room.otherUser.position}
            </span>
          )}
        </div>
        <p className="text-[length:var(--text-base)] text-[color:var(--color-text-muted)] truncate mt-[2px]">
          {room.lastMessage}
        </p>
      </div>

      {/* 시간 + 안읽은 메시지 */}
      <div className="shrink-0 flex flex-col items-end gap-[var(--space-2)] self-start mt-[2px]">
        <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-light)]">
          {room.lastMessageTime}
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
