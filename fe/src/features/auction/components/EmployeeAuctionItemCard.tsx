import type { AuctionItem } from './AuctionItemCard';

const STATUS_STYLES: Record<
  AuctionItem['displayStatus'],
  { badge: string; text: string }
> = {
  active: {
    badge: 'bg-[var(--color-status-orange-bg)]',
    text: 'text-[var(--color-status-orange-dot)]',
  },
  closed: {
    badge: 'bg-[var(--color-action-schedule)]/20',
    text: 'text-[var(--color-action-schedule)]',
  },
  cancelled: {
    badge: 'bg-[var(--color-bg-surface)]',
    text: 'text-[var(--color-text-muted)]',
  },
  expired: {
    badge: 'bg-[var(--color-bg-surface)]',
    text: 'text-[var(--color-text-muted)]',
  },
};

interface EmployeeAuctionItemCardProps {
  auction: AuctionItem;
  winnerIds: number[];
  userId: number;
  onJoin?: () => void;
}

export default function EmployeeAuctionItemCard({
  auction,
  winnerIds,
  userId,
  onJoin,
}: EmployeeAuctionItemCardProps) {
  const isCompleted = auction.status === 'completed';
  const isActive = auction.displayStatus === 'active';
  const statusStyle = STATUS_STYLES[auction.displayStatus];
  const isMyWin = isCompleted && winnerIds.includes(userId);

  return (
    <div className="self-stretch p-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-2xl)] border border-[var(--color-border-light)] shadow-[var(--shadow-form-card)] flex flex-col justify-start items-start gap-[var(--space-4)]">
      <div className="self-stretch inline-flex justify-between items-center">
        <div
          className={`px-[var(--space-3)] py-[var(--space-1)] rounded-[var(--radius-md)] inline-flex justify-center items-center ${statusStyle.badge}`}
        >
          {isActive ? (
            <span
              className={`inline-flex items-center gap-[var(--space-1)] text-[length:var(--text-xs)] font-bold leading-4 ${statusStyle.text}`}
            >
              <span className="tabular-nums min-w-[var(--size-time-label)] text-right">
                {auction.statusLabel}
              </span>
              <span className="shrink-0">~ 종료</span>
            </span>
          ) : (
            <span
              className={`text-[length:var(--text-xs)] font-bold leading-4 ${statusStyle.text}`}
            >
              {auction.statusLabel}
            </span>
          )}
        </div>

        {isCompleted && (
          <div
            className={`px-[var(--space-3)] py-[var(--space-1)] rounded-[var(--radius-md)] inline-flex justify-center items-center ${
              isMyWin
                ? 'bg-[var(--color-status-green-bg)]'
                : 'bg-[var(--color-bg-surface)]'
            }`}
          >
            <span
              className={`text-[length:var(--text-xs)] font-bold leading-4 ${
                isMyWin
                  ? 'text-[var(--color-status-green-dot)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              {isMyWin ? '낙찰됨' : '미낙찰'}
            </span>
          </div>
        )}
      </div>

      <div className="self-stretch inline-flex justify-between items-start">
        <div className="inline-flex flex-col justify-start items-start gap-[var(--space-1)]">
          <span className="text-[var(--color-text-primary)] text-[length:var(--text-xl)] font-bold leading-7">
            {auction.workDate} ({auction.staffCount}명)
          </span>
          <span className="text-[var(--color-text-muted)] text-[length:var(--text-sm)] font-medium leading-5">
            {auction.startTime} ~ {auction.endTime} ({auction.workHours}시간)
          </span>
        </div>
      </div>

      <div className="self-stretch p-[var(--space-4)] bg-[var(--color-bg-card)] rounded-[var(--radius-xl)] flex flex-col justify-start items-start gap-[var(--space-2)]">
        <div className="self-stretch inline-flex justify-between items-center">
          <span className="text-[var(--color-text-muted)] text-[length:var(--text-base)] font-medium leading-4">
            최저 시급
          </span>
          <span className="text-[var(--color-status-orange-dot)] text-[length:var(--text-base)] font-medium leading-5">
            {auction.minWage}원
          </span>
        </div>
        <div className="self-stretch inline-flex justify-between items-center">
          <span className="text-[var(--color-text-muted)] text-[length:var(--text-base)] font-medium leading-4">
            최고 시급
          </span>
          <span className="text-[var(--color-action-schedule)] text-[length:var(--text-base)] font-medium leading-5">
            {auction.maxWage}원
          </span>
        </div>
      </div>

      {!isCompleted && (
        <button
          onClick={onJoin}
          className="self-stretch h-11 py-[var(--space-4)] bg-[var(--color-primary)] rounded-[var(--radius-sm)] inline-flex justify-center items-center"
        >
          <span className="text-center text-[var(--color-text-primary)] text-[length:var(--text-base)] font-bold leading-5">
            경매 참가
          </span>
        </button>
      )}
    </div>
  );
}
