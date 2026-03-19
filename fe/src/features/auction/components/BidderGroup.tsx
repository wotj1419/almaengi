import type { BidderDto } from '@/api/auction.types';

interface BidderGroupProps {
  title: string;
  description: string;
  bidders: BidderDto[];
  borderColor: string;
  rankColor: string;
  selectedBidIds: number[];
  onToggle: (bidId: number) => void;
}

export default function BidderGroup({
  title,
  description,
  bidders,
  borderColor,
  rankColor,
  selectedBidIds,
  onToggle,
}: BidderGroupProps) {
  if (bidders.length === 0) return null;

  return (
    <div className="self-stretch pb-5 bg-[var(--color-bg-white)] rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-[var(--color-border-light)] flex flex-col justify-center items-start gap-2.5 overflow-hidden">
      {/* 섹션 헤더 */}
      <div className="self-stretch px-5 pt-4 pb-[5px] border-b border-[var(--color-border-light)] flex justify-between items-center">
        <div className="flex-1 flex flex-col justify-start items-start">
          <span className="text-[var(--color-text-primary)] text-base font-bold leading-6">
            {title}
          </span>
          <span className="text-[var(--color-text-muted)] text-xs font-medium leading-4">
            {description}
          </span>
        </div>
      </div>

      {/* 입찰자 목록 */}
      <div className="self-stretch px-3.5 flex flex-col gap-3">
        {bidders.map((bidder, i) => {
          const isSelected = selectedBidIds.includes(bidder.bidId);
          const bidTimeStr = new Date(bidder.bidTime).toLocaleTimeString(
            'ko-KR',
            { hour: '2-digit', minute: '2-digit', hour12: false }
          );
          const wageStr = bidder.proposedWage.toLocaleString('ko-KR');

          return (
            <button
              key={bidder.bidId}
              onClick={() => onToggle(bidder.bidId)}
              className={`w-full p-4 rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border-l-4 ${borderColor} inline-flex justify-start items-center gap-1 ${
                isSelected
                  ? 'bg-[var(--color-bg-card)] ring-2 ring-[var(--color-primary)]'
                  : 'bg-[var(--color-bg-white)]'
              }`}
            >
              {/* 순위 */}
              <span className={`w-3 text-lg font-bold leading-7 ${rankColor}`}>
                {i + 1}
              </span>

              {/* 프로필 */}
              <div className="w-10 h-10 ml-1 bg-[var(--color-bg-surface)] rounded-full overflow-hidden flex-shrink-0">
                <img
                  className="w-10 h-10 rounded-full object-cover"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(bidder.applicantName)}&size=40&background=e2e8f0`}
                  alt={bidder.applicantName}
                />
              </div>

              {/* 이름 + 입찰 시간 */}
              <div className="flex-1 flex flex-col items-start ml-1">
                <span className="text-[var(--color-text-primary)] text-base font-bold leading-6">
                  {bidder.applicantName}
                </span>
                <span className="text-[var(--color-text-muted)] text-xs font-medium leading-4">
                  {bidTimeStr} 입찰
                </span>
              </div>

              {/* 입찰 금액 */}
              <span className="text-[var(--color-text-primary)] text-xl font-bold leading-6">
                {wageStr}원
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
