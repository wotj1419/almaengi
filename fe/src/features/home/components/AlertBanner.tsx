import { TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function AlertBanner() {
  const navigate = useNavigate();

  return (
    <div
      className="relative z-[var(--z-content)] flex items-center gap-[var(--space-5)] bg-white h-[70px] pl-[var(--space-6)] pr-[var(--space-7)] rounded-[var(--radius-sm)] w-full border border-[var(--color-primary)] shadow-[var(--shadow-alert)] cursor-pointer"
      onClick={() => navigate(ROUTES.CHATBOT)}
    >
      <TriangleAlert
        size={22}
        color="var(--color-warning)"
        strokeWidth={2}
        className="shrink-0"
      />
      <span className="text-[length:var(--text-md)] font-medium text-black">
        알맹이랑 이번 달 급여 지출 상담하기
      </span>
    </div>
  );
}
