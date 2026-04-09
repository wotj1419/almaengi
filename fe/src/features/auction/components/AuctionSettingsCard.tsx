interface AuctionSettingsCardProps {
  minWage: string;
  maxWage: string;
  deadline: string;
  deadlineErrorMessage?: string;
  onMinWageChange?: (value: string) => void;
  onMaxWageChange?: (value: string) => void;
  onDeadlineClick?: () => void;
}

export default function AuctionSettingsCard({
  minWage,
  maxWage,
  deadline,
  deadlineErrorMessage,
  onMinWageChange,
  onMaxWageChange,
  onDeadlineClick,
}: AuctionSettingsCardProps) {
  return (
    <div className="self-stretch p-5 bg-[var(--color-bg-white)] rounded-2xl shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] flex flex-col justify-center items-center gap-4 overflow-hidden">
      <div className="self-stretch text-[var(--color-text-primary)] text-lg font-medium leading-7">
        경매 설정
      </div>
      <div className="self-stretch flex flex-col justify-start items-start gap-4">
        <div className="self-stretch inline-flex justify-center items-start gap-3">
          <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-1.5">
            <div className="self-stretch text-[var(--color-text-muted)] text-base font-medium leading-5">
              시급 하한가
            </div>
            <div className="self-stretch relative">
              <div className="self-stretch px-4 py-3 bg-[var(--color-bg-card)] rounded-xl inline-flex items-center overflow-hidden">
                <input
                  type="text"
                  inputMode="numeric"
                  value={minWage}
                  onChange={(e) => onMinWageChange?.(e.target.value)}
                  className="w-full bg-transparent outline-none text-[var(--color-text-primary)] text-base font-medium leading-5"
                />
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-placeholder)] text-sm font-medium leading-5 pointer-events-none">
                원
              </div>
            </div>
            {Number(minWage.replace(/,/g, '')) < 10320 && (
              <div className="self-stretch text-[var(--color-danger)] text-[10px] font-medium leading-3">
                최저시급보다 낮습니다.
              </div>
            )}
          </div>

          <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-1.5">
            <div className="self-stretch text-[var(--color-text-muted)] text-base font-medium leading-5">
              시급 상한가
            </div>
            <div className="self-stretch relative">
              <div className="self-stretch px-4 py-3 bg-[var(--color-bg-card)] rounded-xl inline-flex items-center overflow-hidden">
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxWage}
                  onChange={(e) => onMaxWageChange?.(e.target.value)}
                  className="w-full bg-transparent outline-none text-[var(--color-text-primary)] text-base font-medium leading-5"
                />
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-placeholder)] text-sm font-medium leading-5 pointer-events-none">
                원
              </div>
            </div>
            <div className="self-stretch text-[var(--color-action-schedule)] text-[10px] font-medium leading-3">
              기본 시급의 1.2배 자동 계산
            </div>
          </div>
        </div>

        <div className="self-stretch inline-flex flex-col justify-start items-start gap-1.5">
          <div className="self-stretch text-[var(--color-text-muted)] text-base font-medium leading-5">
            경매 마감
          </div>
          <button
            type="button"
            onClick={onDeadlineClick}
            className="self-stretch px-4 py-3 bg-[var(--color-bg-card)] rounded-xl inline-flex justify-center items-center overflow-hidden"
          >
            <div className="flex-1 text-[var(--color-text-primary)] text-base font-medium leading-5 text-left">
              {deadline}
            </div>
          </button>
          {deadlineErrorMessage && (
            <div className="self-stretch text-[var(--color-danger)] text-[10px] font-medium leading-3">
              {deadlineErrorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
