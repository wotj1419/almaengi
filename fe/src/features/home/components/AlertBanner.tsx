import { Egg } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function AlertBanner() {
  const navigate = useNavigate();

  return (
    <div
      className="relative z-[var(--z-content)] flex items-center gap-[var(--space-5)] bg-white h-[70px] pl-[var(--space-6)] pr-[var(--space-7)] rounded-[var(--radius-sm)] w-full border border-[var(--color-primary)] shadow-[var(--shadow-alert)] cursor-pointer"
      onClick={() =>
        navigate(ROUTES.STORE_CHAT_ROOM.replace(':chatRoomId', '0'), {
          state: { from: 'home-direct' },
        })
      }
    >
      <Egg
        size={22}
        color="var(--color-bg-dark)"
        fill="var(--color-primary)"
        strokeWidth={1.5}
        className="shrink-0"
      />
      <span className="text-[length:var(--text-md)] font-medium text-black">
        직원 급여 문제, 혼자 고민하지 마세요 ~~ <br />
        알맹이가 도와드릴게요.
      </span>
    </div>
  );
}
