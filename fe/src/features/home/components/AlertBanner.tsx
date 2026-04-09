import { Egg } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import useAuthStore from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import useStoreStore from '@/stores/useStoreStore';

export default function AlertBanner() {
  const navigate = useNavigate();
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const currentStoreId = useStoreStore((s) => s.currentStore?.storeId ?? null);
  const storeId = activeStoreId ?? currentStoreId;
  const rooms = useChatStore((s) => s.rooms);
  const createBotRoom = useChatStore((s) => s.createBotRoom);

  const handleClick = async () => {
    // 이미 BOT 방이 있으면 바로 이동
    const botRoom = rooms.find((r) => r.roomType === 'BOT');
    if (botRoom) {
      navigate(
        ROUTES.STORE_CHAT_ROOM.replace(':chatRoomId', String(botRoom.roomId)),
        { state: { from: 'home-direct' } }
      );
      return;
    }
    // BOT 방이 없으면 생성(또는 기존 방 가져오기) 후 이동
    if (!storeId) return;
    const roomId = await createBotRoom(storeId);
    navigate(ROUTES.STORE_CHAT_ROOM.replace(':chatRoomId', String(roomId)), {
      state: { from: 'home-direct' },
    });
  };

  return (
    <div
      className="relative z-[var(--z-content)] flex items-center gap-[var(--space-5)] bg-[var(--color-bg-white)] h-[70px] pl-[var(--space-6)] pr-[var(--space-7)] rounded-[var(--radius-sm)] w-full border border-[var(--color-primary)] shadow-[var(--shadow-alert)] cursor-pointer"
      onClick={() => void handleClick()}
    >
      <Egg
        size={22}
        color="var(--color-bg-dark)"
        fill="var(--color-primary)"
        strokeWidth={1.5}
        className="shrink-0"
      />
      <span className="text-[length:var(--text-md)] font-medium text-[color:var(--color-text-black)]">
        급여 문제, 혼자 고민하지 마세요 ~~ <br />
        알맹이가 도와드릴게요.
      </span>
    </div>
  );
}
