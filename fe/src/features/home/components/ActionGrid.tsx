import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ActionCard from './ActionCard';
import { ROUTES } from '@/constants/routes';
import { getRooms } from '@/api/chat';
import useStoreStore from '@/stores/useStoreStore';

export default function ActionGrid() {
  const currentStore = useStoreStore((s) => s.currentStore);
  const location = useLocation();
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  const checkUnread = useCallback(() => {
    if (!currentStore) return;
    getRooms(currentStore.storeId)
      .then((rooms) => {
        const total = rooms.reduce((sum, r) => sum + r.unreadCount, 0);
        setHasUnreadChat(total > 0);
      })
      .catch(() => {});
  }, [currentStore]);

  // 홈 화면에 돌아올 때마다 재체크
  useEffect(() => {
    checkUnread();
  }, [checkUnread, location.key]);

  return (
    <div className="grid grid-cols-2 gap-x-[var(--space-3)] gap-y-[var(--space-4)] w-full">
      <ActionCard
        title="매장 채팅"
        bgColor="bg-[var(--color-action-todo)]"
        iconColor="var(--color-icon-dark)"
        icon="chat"
        showNewBadge={hasUnreadChat}
        path={`${ROUTES.STORE_COMMUNITY}?tab=chat`}
        state={{ from: 'home' }}
      />
      <ActionCard
        title="스케줄 경매"
        bgColor="bg-[var(--color-action-schedule)]"
        textColor="text-[color:var(--color-action-schedule-text)]"
        iconColor="var(--color-icon-light)"
        icon="schedule"
        path={ROUTES.AUCTION}
        state={{ from: 'home' }}
      />
      <ActionCard
        title="할 일 관리"
        bgColor="bg-[var(--color-action-board)]"
        iconColor="var(--color-icon-muted)"
        icon="todo"
        path={ROUTES.TODO}
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
