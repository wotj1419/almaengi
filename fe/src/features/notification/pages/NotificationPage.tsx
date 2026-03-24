import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import {
  useMarkNotificationAsRead,
  useMarkNotificationsAsRead,
  useNotifications,
} from '../hooks/useNotificationQueries';
import { resolveNotificationRoute } from '../fcm/route';

export default function NotificationPage() {
  const navigate = useNavigate();
  // 알림 목록 조회
  const { data: notifications = [], isLoading, isError } = useNotifications();
  // 단건/다건 읽음 mutation
  const markOne = useMarkNotificationAsRead();
  const markMany = useMarkNotificationsAsRead();
  // unread id 목록 (모두 읽음 처리에 사용)
  const unreadIds = notifications.filter((item) => !item.isRead).map((item) => item.id);
  // 모두 읽음 처리
  const handleReadAll = () => {
    if (unreadIds.length === 0) return;
    markMany.mutate(unreadIds);
  };
  // 알림 클릭 시: 읽음 처리 -> 타입별 라우팅
  const handleNotificationClick = async (
    id: number,
    type: (typeof notifications)[number]['type'],
    targetId: number | null,
    isRead: boolean
  ) => {
    try {
      if (!isRead) {
        await markOne.mutateAsync(id);
      }
    } finally {
      const route = resolveNotificationRoute(type, targetId);
      navigate(route);
    }
  };
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-body)]">
      <Header title="알림" />
      <main className="px-[15px] pt-4 pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)]">
            알림 목록
          </h1>
          <button
            type="button"
            onClick={handleReadAll}
            disabled={unreadIds.length === 0 || markMany.isPending}
            className="text-[length:var(--text-sm)] font-medium text-[var(--color-text-secondary)] disabled:text-[var(--color-text-placeholder)]"
          >
            모두 읽음
          </button>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-[var(--color-text-muted)]">
            알림을 불러오는 중입니다.
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-[var(--color-danger)]">
            알림을 불러오지 못했습니다.
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-[var(--color-text-muted)]">
            도착한 알림이 없습니다.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {notifications.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() =>
                    handleNotificationClick(
                      item.id,
                      item.type,
                      item.targetId,
                      item.isRead
                    )
                  }
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    item.isRead
                      ? 'bg-[var(--color-bg-white)] border-[var(--color-border-light)]'
                      : 'bg-[#fffbe8] border-[#f5e7a1]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-[length:var(--text-base)] text-[var(--color-text-primary)]">
                      {item.title}
                    </strong>
                    {!item.isRead && (
                      <span className="text-[11px] font-bold text-[var(--color-danger)]">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
                    {item.body}
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}