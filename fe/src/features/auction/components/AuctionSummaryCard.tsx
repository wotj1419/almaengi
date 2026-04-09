interface AuctionSummaryCardProps {
  inProgressCount: number;
  completedCount: number;
  onRegister?: () => void;
}

export default function AuctionSummaryCard({
  inProgressCount,
  completedCount,
  onRegister,
}: AuctionSummaryCardProps) {
  return (
    <div className="self-stretch px-6 pt-6 pb-7 bg-[var(--color-bg-dark)] rounded-2xl inline-flex flex-col justify-start items-start gap-1">
      <div className="self-stretch inline-flex justify-between items-center">
        <div className="text-white text-xl font-bold leading-7">
          경매 근무 관리
        </div>
        {onRegister && (
          <button
            onClick={onRegister}
            className="h-7 px-4 bg-[var(--color-primary)] rounded-full inline-flex justify-center items-center"
          >
            <span className="text-[var(--color-text-primary)] text-base font-bold font-['Pretendard'] leading-5">
              경매 등록
            </span>
          </button>
        )}
      </div>
      <div className="self-stretch pt-5 inline-flex justify-between items-center">
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-center text-[var(--color-text-light)] text-xs font-medium leading-4">
            진행 중
          </span>
          <span className="text-center text-[var(--color-primary)] text-2xl font-bold leading-8">
            {inProgressCount}
          </span>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-center text-[var(--color-text-light)] text-xs font-medium leading-4">
            종료
          </span>
          <span className="text-center text-[var(--color-status-purple-border)] text-2xl font-bold leading-8">
            {completedCount}
          </span>
        </div>
      </div>
    </div>
  );
}
