import { useEffect, useMemo, useState } from 'react';
import workingImg from '@/assets/images/working.png';

// 백엔드 AttendanceStatus와 동일. DONE은 clockOut 존재 여부로 판단
export type AttendanceStatus =
  | 'WAITING'
  | 'WORKING'
  | 'LATE'
  | 'ABSENT'
  | 'DONE';

interface Props {
  status: AttendanceStatus;
  clockInTime: Date | null;
  scheduledEndTime?: string | null; // e.g. "18:00:00"
}

const bgColors: Record<AttendanceStatus, string> = {
  WAITING: 'bg-[var(--color-bg-surface)]',
  WORKING: 'bg-[var(--color-badge-green-bg)]',
  LATE: 'bg-[var(--color-badge-orange-bg)]',
  ABSENT: 'bg-[var(--color-bg-surface)]',
  DONE: 'bg-[var(--color-badge-purple-bg)]',
};

const textColors: Record<AttendanceStatus, string> = {
  WAITING: 'text-[color:var(--color-text-placeholder)]',
  WORKING: 'text-[color:var(--color-badge-green-text)]',
  LATE: 'text-[color:var(--color-badge-orange-text)]',
  ABSENT: 'text-[color:var(--color-text-placeholder)]',
  DONE: 'text-[color:var(--color-badge-purple-text)]',
};

const barColors: Record<AttendanceStatus, string> = {
  WAITING: 'bg-[var(--color-border-muted)]',
  WORKING: 'bg-[var(--chart-attendance-working)]',
  LATE: 'bg-[var(--chart-attendance-late)]',
  ABSENT: 'bg-[var(--color-border-muted)]',
  DONE: 'bg-[var(--chart-attendance-done)]',
};

const statusLabels: Record<AttendanceStatus, string> = {
  WAITING: '출근 전',
  WORKING: '근무 중',
  LATE: '지각',
  ABSENT: '결근',
  DONE: '퇴근',
};

export default function EmployeeWorkStatus({
  status,
  clockInTime,
  scheduledEndTime,
}: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status !== 'WORKING' && status !== 'LATE') return;
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [status]);

  const { progress, subText } = useMemo(() => {
    if (status === 'WAITING' || status === 'ABSENT') {
      return { progress: 0, subText: '-' };
    }

    if (status === 'DONE') {
      return { progress: 100, subText: '완료' };
    }

    // WORKING / LATE
    const now = new Date();
    const endTime = new Date();
    if (scheduledEndTime) {
      const parts = scheduledEndTime.split(':').map(Number);
      const h = parts[0];
      const m = parts[1] ?? 0;
      if (!isNaN(h) && !isNaN(m)) {
        endTime.setHours(h, m, 0, 0);
      } else {
        endTime.setHours(18, 0, 0, 0);
      }
    } else {
      endTime.setHours(18, 0, 0, 0);
    }

    const start = clockInTime ?? now;
    const elapsed = Math.max(0, (now.getTime() - start.getTime()) / 60000);
    const totalScheduled = Math.max(
      1,
      (endTime.getTime() - start.getTime()) / 60000
    );
    const remaining = Math.max(0, (endTime.getTime() - now.getTime()) / 60000);
    const progress = Math.min(100, (elapsed / totalScheduled) * 100);

    let rh = Math.floor(remaining / 60);
    let rm = Math.ceil(remaining % 60);
    if (rm === 60) {
      rh += 1;
      rm = 0;
    }
    const hasTimeLeft = endTime.getTime() > now.getTime() && (rh > 0 || rm > 0);
    const subText = hasTimeLeft
      ? rh > 0
        ? `${rh}시간 ${rm}분 남음`
        : `${rm}분 남음`
      : '퇴근 가능';
    const finalProgress = hasTimeLeft ? progress : 100;

    return { progress: finalProgress, subText };
  }, [status, clockInTime, scheduledEndTime, tick]);

  return (
    <div
      className={`${bgColors[status]} flex-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-badge)]`}
    >
      <div className="flex flex-col justify-between px-[var(--space-4)] pt-[var(--space-5)] pb-[var(--space-5)] h-full">
        {/* 상태 라벨 + 시간 */}
        <div className="flex items-center justify-between">
          <span
            className={`${textColors[status]} text-[length:var(--text-md)] font-bold leading-tight`}
          >
            {statusLabels[status]}
          </span>
          <span
            className={`${textColors[status]} text-[length:var(--text-md)] font-bold`}
          >
            {subText}
          </span>
        </div>

        {/* 진행 바 + 캐릭터 */}
        <div className="relative w-full">
          {(status === 'WORKING' || status === 'LATE') && (
            <img
              src={workingImg}
              alt="running"
              className="absolute -top-[52px] w-[52px] h-[52px] object-contain transition-all duration-300"
              style={{
                left: `clamp(0px, calc(${progress}% - 26px), calc(100% - 52px))`,
              }}
            />
          )}
          <div className="w-full h-[6px] bg-[var(--chart-attendance-track-active)] rounded-full overflow-hidden">
            <div
              className={`${barColors[status]} h-full rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
