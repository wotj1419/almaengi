import { ChevronDown, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function Header() {
  const navigate = useNavigate();

  return (
    <div
      className="relative z-[var(--z-content)] bg-[var(--color-bg-dark)] w-full shrink-0 flex items-center justify-between px-[var(--space-5)] pb-[var(--space-5)]"
      style={{ paddingTop: 'calc(45px + env(safe-area-inset-top, 0px))' }}
    >
      {/* 왼쪽: 매장명 + 드롭다운 화살표 */}
      <div className="flex items-center gap-[9px]">
        <span className="text-[length:var(--text-2xl)] text-white font-bold font-['Noto_Sans_KR:Bold',sans-serif]">
          부산갈매기 싸피점
        </span>
        <ChevronDown size={24} color="white" strokeWidth={2.3} />
      </div>

      {/* 오른쪽: 알림 벨 + 빨간 점 */}
      <div
        onClick={() => navigate(ROUTES.NOTIFICATION)}
        className="relative cursor-pointer"
      >
        <Bell size={25} color="white" strokeWidth={1.95} />
        <div className="absolute top-0 right-0 size-[8px] bg-[var(--color-danger)] rounded-full border-[1.5px] border-[var(--color-bg-dark)]" />
      </div>
    </div>
  );
}
