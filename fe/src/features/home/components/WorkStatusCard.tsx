import { useState } from 'react';
import StatusBadge from './StatusBadge';
import WorkStatusSheet from './WorkStatusSheet';

type FilterColor = 'green' | 'orange' | 'purple';

export default function WorkStatusCard() {
  const [sheetFilter, setSheetFilter] = useState<FilterColor | null>(null);

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
            <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-light)] font-bold leading-normal">
              오전 10:30 기준
            </span>
          </div>

          {/* 상태 뱃지들 */}
          <div className="flex gap-[9px]">
            <StatusBadge
              count={4}
              label="근무 중"
              color="green"
              onClick={() => openSheet('green')}
            />
            <StatusBadge
              count={2}
              label="지각"
              color="orange"
              onClick={() => openSheet('orange')}
            />
            <StatusBadge
              count={1}
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
        filter={sheetFilter}
      />
    </>
  );
}
