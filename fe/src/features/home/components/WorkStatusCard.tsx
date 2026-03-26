import { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import WorkStatusSheet from './WorkStatusSheet';
import { getDashboardSummary, type DashboardSummary } from '@/api/attendance';
import useStoreStore from '@/stores/useStoreStore';

type FilterColor = 'green' | 'orange' | 'purple';

const STATUS_MAP: Record<FilterColor, keyof DashboardSummary> = {
  green: 'working',
  orange: 'late',
  purple: 'absent',
};

export default function WorkStatusCard() {
  const [sheetFilter, setSheetFilter] = useState<FilterColor | null>(null);
  const [summary, setSummary] = useState<DashboardSummary>({
    working: 0,
    late: 0,
    absent: 0,
  });
  const currentStore = useStoreStore((s) => s.currentStore);

  useEffect(() => {
    if (!currentStore) return;
    getDashboardSummary(currentStore.storeId)
      .then(setSummary)
      .catch(() => {});
  }, [currentStore]);

  const openSheet = (color: FilterColor) => setSheetFilter(color);
  const closeSheet = () => setSheetFilter(null);

  return (
    <>
      <div className="relative z-[var(--z-content)] bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] shrink-0 w-full">
        <div className="flex flex-col gap-[var(--space-5)] px-[var(--space-5)] py-[var(--space-5)]">
          {/* 헤더: 제목 + 기준 시간 */}
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-xl)] text-[color:var(--color-text-primary)] font-bold leading-tight">
              매장 근무 현황
            </span>
          </div>

          {/* 상태 뱃지들 */}
          <div className="flex gap-[9px]">
            <StatusBadge
              count={summary.working}
              label="근무 중"
              color="green"
              onClick={() => openSheet('green')}
            />
            <StatusBadge
              count={summary.late}
              label="지각"
              color="orange"
              onClick={() => openSheet('orange')}
            />
            <StatusBadge
              count={summary.absent}
              label="결근"
              color="purple"
              onClick={() => openSheet('purple')}
            />
          </div>
        </div>
      </div>

      {/* 바텀시트 */}
      <WorkStatusSheet
        isOpen={sheetFilter !== null}
        onClose={closeSheet}
        apiStatus={sheetFilter ? STATUS_MAP[sheetFilter] : null}
      />
    </>
  );
}
