import { Trash2 } from 'lucide-react';

export interface Bidder {
  name: string;
  amount: string;
  avatar?: string;
}

export interface AuctionItem {
  id: number;
  status: 'inProgress' | 'completed';
  displayStatus: 'active' | 'closed' | 'cancelled' | 'expired';
  statusLabel: string;
  isAwarded: boolean;
  registeredDate: string;
  workDate: string;
  staffCount: number;
  startTime: string;
  endTime: string;
  workHours: number;
  minWage: string;
  maxWage: string;
  bidders?: Bidder[];
  primaryAction: 'viewDetail' | 'viewResult';
  primaryActionLabel: string;
}

interface AuctionItemCardProps {
  auction: AuctionItem;
  onViewBids?: () => void;
  onViewResult?: () => void;
  onEdit?: () => void;
  onStop?: () => void;
  onDeleteCompleted?: () => void;
}

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

export default function AuctionItemCard({
  auction,
  onViewBids,
  onViewResult,
  onEdit,
  onStop,
  onDeleteCompleted,
}: AuctionItemCardProps) {
  const isCompleted =
    auction.displayStatus === 'closed' || auction.displayStatus === 'cancelled';

  const statusStyle = STATUS_STYLES[auction.displayStatus];
  const isActive = auction.displayStatus === 'active';

  const handlePrimaryAction = () => {
    if (auction.primaryAction === 'viewResult') {
      onViewResult?.();
      return;
    }

    onViewBids?.();
  };

  return (
    <div className="self-stretch p-5 bg-[var(--color-bg-white)] rounded-2xl shadow-[0px_4px_20px_0px_rgba(0,0,0,0.04)] flex flex-col justify-start items-start gap-4">
      <div className="self-stretch inline-flex justify-between items-center">
        <div
          className={`px-2.5 py-1 rounded-md inline-flex justify-center items-center ${statusStyle.badge}`}
        >
          {isActive ? (
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold leading-4 ${statusStyle.text}`}
            >
              <span className="tabular-nums min-w-[62px] text-right">
                {auction.statusLabel}
              </span>
              <span className="shrink-0">후 종료</span>
            </span>
          ) : (
            <span className={`text-xs font-bold leading-4 ${statusStyle.text}`}>
              {auction.statusLabel}
            </span>
          )}
        </div>
        {isCompleted ? (
          <button
            type="button"
            aria-label="종료 경매 삭제"
            onClick={onDeleteCompleted}
            className="inline-flex items-center justify-center rounded-md p-1 text-[var(--color-text-light)] hover:bg-[var(--color-bg-surface)]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <span className="text-right text-[var(--color-text-light)] text-xs font-medium leading-4">
            {auction.registeredDate}
          </span>
        )}
      </div>

      <div className="self-stretch inline-flex justify-between items-start">
        <div className="inline-flex flex-col justify-start items-start gap-1">
          <span className="text-[var(--color-text-primary)] text-xl font-bold leading-7">
            {auction.workDate} ({auction.staffCount}명)
          </span>
          <span className="text-[var(--color-text-muted)] text-sm font-medium leading-5">
            {auction.startTime} ~ {auction.endTime} ({auction.workHours}시간)
          </span>
        </div>
        {isCompleted && auction.bidders && auction.bidders.length > 0 && (
          <div className="flex">
            {auction.bidders.map((bidder, index) => (
              <div key={index} className="w-8 h-8">
                <img
                  className="w-8 h-8 rounded-full object-cover"
                  src={
                    bidder.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(bidder.name)}&size=32&background=e2e8f0`
                  }
                  alt={bidder.name}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="self-stretch p-4 bg-[var(--color-bg-card)] rounded-xl flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-between items-center">
          <span className="text-[var(--color-text-muted)] text-base font-medium leading-4">
            최저 시급
          </span>
          <span className="text-[var(--color-status-orange-dot)] text-base font-medium leading-5">
            {auction.minWage}원
          </span>
        </div>
        <div className="self-stretch inline-flex justify-between items-center">
          <span className="text-[var(--color-text-muted)] text-base font-medium leading-4">
            최고 시급
          </span>
          <span className="text-[var(--color-action-schedule)] text-base font-medium leading-5">
            {auction.maxWage}원
          </span>
        </div>
      </div>

      {isCompleted && auction.bidders && auction.bidders.length > 0 && (
        <div className="self-stretch px-4 pt-4 pb-3.5 bg-[var(--color-bg-card)] rounded-xl flex flex-col justify-start items-start gap-2">
          {auction.bidders.map((bidder, index) => (
            <div
              key={index}
              className="self-stretch inline-flex justify-between items-center"
            >
              <span className="text-[var(--color-text-muted)] text-base font-bold leading-4">
                {bidder.name}
              </span>
              <span className="text-[var(--color-text-primary)] text-sm font-bold leading-5">
                {bidder.amount}원
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handlePrimaryAction}
        className="self-stretch h-11 py-4 bg-[var(--color-primary)] rounded-[10px] inline-flex justify-center items-center"
      >
        <span className="text-center text-[var(--color-text-primary)] text-base font-bold leading-5">
          {auction.primaryActionLabel}
        </span>
      </button>

      {!isCompleted && (
        <div className="self-stretch inline-flex justify-center items-start gap-2">
          <button
            onClick={onEdit}
            className="flex-1 py-3 bg-[var(--color-bg-surface)] rounded-[10px] inline-flex justify-center items-center"
          >
            <span className="text-center text-[var(--color-text-muted)] text-xs font-medium leading-4">
              수정
            </span>
          </button>
          <button
            onClick={onStop}
            className="flex-1 py-3 bg-[var(--color-bg-surface)] rounded-[10px] inline-flex justify-center items-center"
          >
            <span className="text-center text-[var(--color-text-muted)] text-xs font-medium leading-4">
              경매 중단
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
