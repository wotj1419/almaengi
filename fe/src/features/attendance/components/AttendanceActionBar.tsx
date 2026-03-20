import { type Tab } from '../types';

interface Props {
  activeTab: Tab;
  selectedIds: Set<number>;
  onAction: (label: string, action: () => void) => void;
  onUpdateStatus: (ids: number[], status: Tab) => void;
  onDelete: (ids: number[]) => void;
  onCancel: () => void;
}

export default function AttendanceActionBar({
  activeTab,
  selectedIds,
  onAction,
  onUpdateStatus,
  onDelete,
  onCancel,
}: Props) {
  return (
    <div className="fixed bottom-[var(--height-bottom-nav)] left-0 right-0 z-[var(--z-nav)] flex justify-center">
      <div className="w-full max-w-[var(--max-w-app)] px-[var(--space-5)] py-[var(--space-3)] flex gap-[var(--space-4)]">
        {activeTab === '대기' && (
          <>
            <button
              onClick={() =>
                onAction('거절', () => {
                  onUpdateStatus([...selectedIds], '거절');
                  onCancel();
                })
              }
              className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-status-orange-bg)] border border-[var(--color-status-orange-border)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
            >
              <span className="text-[length:var(--text-lg)] text-[color:var(--color-status-orange-dot)] font-bold">
                거절
              </span>
            </button>
            <button
              onClick={() =>
                onAction('승인', () => {
                  onUpdateStatus([...selectedIds], '승인');
                  onCancel();
                })
              }
              className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-status-green-bg)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
            >
              <span className="text-[length:var(--text-lg)] text-[color:var(--color-status-green-dot)] font-bold">
                승인
              </span>
            </button>
          </>
        )}
        {activeTab === '승인' && (
          <>
            <button
              onClick={() =>
                onAction('삭제', () => {
                  onDelete([...selectedIds]);
                  onCancel();
                })
              }
              className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-border-light)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
            >
              <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-dark)] font-bold">
                삭제
              </span>
            </button>
            <button
              onClick={() =>
                onAction('거절', () => {
                  onUpdateStatus([...selectedIds], '거절');
                  onCancel();
                })
              }
              className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-status-orange-bg)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
            >
              <span className="text-[length:var(--text-lg)] text-[color:var(--color-status-orange-dot)] font-bold">
                거절
              </span>
            </button>
          </>
        )}
        {activeTab === '거절' && (
          <>
            <button
              onClick={() =>
                onAction('삭제', () => {
                  onDelete([...selectedIds]);
                  onCancel();
                })
              }
              className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-border-light)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
            >
              <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-dark)] font-bold">
                삭제
              </span>
            </button>
            <button
              onClick={() =>
                onAction('승인', () => {
                  onUpdateStatus([...selectedIds], '승인');
                  onCancel();
                })
              }
              className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-status-green-bg)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
            >
              <span className="text-[length:var(--text-lg)] text-[color:var(--color-status-green-dot)] font-bold">
                승인
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
