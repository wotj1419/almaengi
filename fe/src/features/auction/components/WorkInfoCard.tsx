import { Calendar } from 'lucide-react';

interface WorkInfoCardProps {
  date: string;
  staffCount: string;
  startTime: string;
  endTime: string;
  staffCountErrorMessage?: string;
  startTimeErrorMessage?: string;
  endTimeErrorMessage?: string;
  onDateClick?: () => void;
  onStartTimeClick?: () => void;
  onEndTimeClick?: () => void;
  onStaffCountChange?: (value: string) => void;
}

export default function WorkInfoCard({
  date,
  staffCount,
  startTime,
  endTime,
  staffCountErrorMessage,
  startTimeErrorMessage,
  endTimeErrorMessage,
  onDateClick,
  onStartTimeClick,
  onEndTimeClick,
  onStaffCountChange,
}: WorkInfoCardProps) {
  return (
    <div className="self-stretch p-5 bg-[var(--color-bg-white)] rounded-2xl shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] inline-flex flex-col justify-start items-start gap-4">
      <div className="self-stretch flex flex-col justify-start items-start">
        <div className="self-stretch text-[var(--color-text-primary)] text-lg font-medium leading-7">
          근무 정보
        </div>
      </div>
      <div className="self-stretch flex flex-col justify-start items-center gap-4">
        <div className="self-stretch inline-flex justify-center items-center gap-3">
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch text-[var(--color-text-muted)] text-base font-medium leading-5">
                근무 날짜
              </div>
            </div>
            <button
              type="button"
              onClick={onDateClick}
              className="self-stretch flex flex-col justify-start items-start"
            >
              <div className="self-stretch px-4 py-3 relative bg-[var(--color-bg-card)] rounded-xl inline-flex justify-center items-start overflow-hidden">
                <div className="h-11 absolute right-2 top-0 flex justify-start items-center">
                  <Calendar
                    className="w-5 h-5 text-[var(--color-icon-muted)]"
                    strokeWidth={1.67}
                  />
                </div>
                <div className="flex-1 inline-flex flex-col justify-start items-start overflow-hidden">
                  <div className="self-stretch text-[var(--color-text-primary)] text-base font-medium leading-5 text-left">
                    {date}
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-1.5">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch text-[var(--color-text-muted)] text-base font-medium leading-5">
                필요 인원
              </div>
            </div>
            <div className="self-stretch relative">
              <div className="self-stretch pl-4 pr-10 py-3 bg-[var(--color-bg-card)] rounded-xl inline-flex items-center overflow-hidden">
                <input
                  type="text"
                  inputMode="numeric"
                  value={staffCount}
                  onChange={(e) => onStaffCountChange?.(e.target.value)}
                  className="w-full bg-transparent outline-none text-[var(--color-text-primary)] text-sm font-medium leading-5"
                />
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-placeholder)] text-sm font-medium leading-5">
                명
              </div>
            </div>
            {staffCountErrorMessage && (
              <div className="self-stretch text-[var(--color-danger)] text-[10px] font-medium leading-3">
                {staffCountErrorMessage}
              </div>
            )}
          </div>
        </div>

        <div className="self-stretch inline-flex justify-center items-start gap-3">
          <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-1.5">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch text-[var(--color-text-muted)] text-base font-medium leading-5">
                시작 시간
              </div>
            </div>
            <button
              type="button"
              onClick={onStartTimeClick}
              className="self-stretch px-4 py-3 bg-[var(--color-bg-card)] rounded-xl inline-flex justify-center items-start overflow-hidden"
            >
              <div className="flex-1 inline-flex flex-col justify-start items-start overflow-hidden">
                <div className="self-stretch text-[var(--color-text-primary)] text-base font-medium leading-5 text-left">
                  {startTime}
                </div>
              </div>
            </button>
            {startTimeErrorMessage && (
              <div className="self-stretch text-[var(--color-danger)] text-[10px] font-medium leading-3">
                {startTimeErrorMessage}
              </div>
            )}
          </div>

          <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-1.5">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch text-[var(--color-text-muted)] text-base font-medium leading-5">
                종료 시간
              </div>
            </div>
            <button
              type="button"
              onClick={onEndTimeClick}
              className="self-stretch px-4 py-3 bg-[var(--color-bg-card)] rounded-xl inline-flex justify-center items-start overflow-hidden"
            >
              <div className="flex-1 inline-flex flex-col justify-start items-start overflow-hidden">
                <div className="self-stretch text-[var(--color-text-primary)] text-base font-medium leading-5 text-left">
                  {endTime}
                </div>
              </div>
            </button>
            {endTimeErrorMessage && (
              <div className="self-stretch text-[var(--color-danger)] text-[10px] font-medium leading-3">
                {endTimeErrorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
