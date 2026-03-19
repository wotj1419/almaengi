import ActionCard from './ActionCard';
import { ROUTES } from '@/constants/routes';

export default function ActionGrid() {
  return (
    <div className="grid grid-cols-2 gap-x-[var(--space-3)] gap-y-[var(--space-4)] w-full">
      <ActionCard
        title="할 일 관리"
        bgColor="bg-[var(--color-action-todo)]"
        iconColor="var(--color-icon-dark)"
        icon="todo"
        path={ROUTES.TODO}
      />
      <ActionCard
        title="스케줄 경매"
        bgColor="bg-[var(--color-action-schedule)]"
        textColor="text-[color:var(--color-action-schedule-text)]"
        iconColor="var(--color-icon-light)"
        icon="schedule"
        showNewBadge
        path={ROUTES.AUCTION}
      />
      <ActionCard
        title="매장 게시판"
        bgColor="bg-[var(--color-action-board)]"
        iconColor="var(--color-icon-muted)"
        icon="board"
        path={`${ROUTES.STORE_COMMUNITY}?tab=board`}
        state={{ from: 'home' }}
      />
      <ActionCard
        title="출퇴근 변경"
        bgColor="bg-[var(--color-action-attendance)]"
        iconColor="var(--color-icon-muted)"
        icon="clock"
        path={ROUTES.ATTENDANCE}
      />
    </div>
  );
}
