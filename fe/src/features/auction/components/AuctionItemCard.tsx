import { Trash2 } from 'lucide-react';

export interface Bidder {
  name: string;
  amount: string;
  avatar?: string;
}

export interface AuctionItem {
  id: number;
  status: 'inProgress' | 'completed';
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
}

interface AuctionItemCardProps {
  auction: AuctionItem;
  onViewBids?: () => void;
  onViewResult?: () => void;
  onEdit?: () => void;
  onStop?: () => void;
  onDelete?: () => void;
}

export default function AuctionItemCard({
  auction,
  onViewBids,
  onViewResult,
  onEdit,
  onStop,
  onDelete,
}: AuctionItemCardProps) {
  const isCompleted = auction.status === 'completed';

  return (
    <div className="self-stretch p-5 bg-[var(--color-bg-white)] rounded-2xl shadow-[0px_4px_20px_0px_rgba(0,0,0,0.04)] flex flex-col justify-start items-start gap-4">
      {/* 상단: 상태 배지 + 삭제 버튼(종료) / 날짜(진행 중) */}
      <div className="self-stretch inline-flex justify-between items-center">
        <div
          className={`px-2.5 py-1 rounded-md inline-flex justify-center items-center ${
            auction.isAwarded
              ? 'bg-[var(--color-action-schedule)]/20'
              : 'bg-[var(--color-status-orange-bg)]'
          }`}
        >
          <span
            className={`text-xs font-bold leading-4 ${
              auction.isAwarded
                ? 'text-[var(--color-action-schedule)]'
                : 'text-[var(--color-status-orange-dot)]'
            }`}
          >
            {auction.statusLabel}
          </span>
        </div>
        {isCompleted ? (
          <button onClick={onDelete} className="p-1">
            <Trash2
              className="w-4 h-4 text-[var(--color-text-light)]"
              strokeWidth={2}
            />
          </button>
        ) : (
          <span className="text-right text-[var(--color-text-light)] text-xs font-medium leading-4">
            {auction.registeredDate}
          </span>
        )}
      </div>

      {/* 근무 정보 */}
      <div className="self-stretch inline-flex justify-between items-start">
        <div className="inline-flex flex-col justify-start items-start gap-1">
          <span className="text-[var(--color-text-primary)] text-xl font-bold leading-7">
            {auction.workDate} ({auction.staffCount}명)
          </span>
          <span className="text-[var(--color-text-muted)] text-sm font-medium leading-5">
            {auction.startTime} ~ {auction.endTime} ({auction.workHours}시간)
          </span>
        </div>
        {/* 입찰자 아바타 */}
        {isCompleted && auction.bidders && auction.bidders.length > 0 && (
          <div className="flex">
            {auction.bidders.map((bidder, i) => (
              <div key={i} className="w-8 h-8">
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

      {/* 시급 정보 */}
      <div className="self-stretch p-4 bg-[var(--color-bg-card)] rounded-xl flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-between items-center">
          <span className="text-[var(--color-text-muted)] text-base font-medium leading-4">
            하한가
          </span>
          <span className="text-[var(--color-status-orange-dot)] text-base font-medium leading-5">
            {auction.minWage}원
          </span>
        </div>
        <div className="self-stretch inline-flex justify-between items-center">
          <span className="text-[var(--color-text-muted)] text-base font-medium leading-4">
            상한가
          </span>
          <span className="text-[var(--color-action-schedule)] text-base font-medium leading-5">
            {auction.maxWage}원
          </span>
        </div>
      </div>

      {/* 입찰자 목록 (종료 시) */}
      {isCompleted && auction.bidders && auction.bidders.length > 0 && (
        <div className="self-stretch px-4 pt-4 pb-3.5 bg-[var(--color-bg-card)] rounded-xl flex flex-col justify-start items-start gap-2">
          {auction.bidders.map((bidder, i) => (
            <div
              key={i}
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

      {/* 메인 버튼: 낙찰 완료 → 경매 결과 보기, 그 외 → 입찰 현황 보기 */}
      {auction.isAwarded ? (
        <button
          onClick={onViewResult}
          className="self-stretch h-11 py-4 bg-[var(--color-primary)] rounded-[10px] inline-flex justify-center items-center"
        >
          <span className="text-center text-[var(--color-text-primary)] text-base font-bold leading-5">
            경매 결과 보기
          </span>
        </button>
      ) : (
        <button
          onClick={onViewBids}
          className="self-stretch h-11 py-4 bg-[var(--color-primary)] rounded-[10px] inline-flex justify-center items-center"
        >
          <span className="text-center text-[var(--color-text-primary)] text-base font-bold leading-5">
            입찰 현황 보기
          </span>
        </button>
      )}

      {/* 수정 / 경매 중단 버튼 (진행 중만) */}
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
