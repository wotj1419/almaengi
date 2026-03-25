import { useMemo } from 'react';
import { PieChart, Pie } from 'recharts';

// 백엔드 AttendanceStatus와 동일. DONE은 clockOut 존재 여부로 판단
export type AttendanceStatus =
  | 'WAITING'
  | 'WORKING'
  | 'LATE'
  | 'ABSENT'
  | 'DONE';

interface Props {
  status: AttendanceStatus;
  // 백엔드 연동 시 교체: clockInTime, scheduledEndTime을 서버 응답에서 받아올 것
  clockInTime: Date | null;
}

const CHART_SIZE = 80;
const CX = CHART_SIZE / 2;
const INNER_RADIUS = 24;
const OUTER_RADIUS = 35;

// 백엔드 연동 시 교체: WorkSchedule의 scheduledEndTime을 서버에서 받아올 것
const SCHEDULED_END_HOUR = 18;
const SCHEDULED_END_MIN = 0;

const CHART_COLORS = {
  working: 'var(--chart-attendance-working)',
  late: 'var(--chart-attendance-late)',
  done: 'var(--chart-attendance-done)',
  track: 'var(--chart-attendance-track)',
  trackActive: 'var(--chart-attendance-track-active)',
} as const;

const bgColors: Record<AttendanceStatus, string> = {
  WAITING: 'bg-gray-100',
  WORKING: 'bg-[var(--color-badge-green-bg)]',
  LATE: 'bg-[var(--color-badge-orange-bg)]',
  ABSENT: 'bg-gray-100',
  DONE: 'bg-[var(--color-badge-purple-bg)]',
};

const textColors: Record<AttendanceStatus, string> = {
  WAITING: 'text-gray-400',
  WORKING: 'text-[color:var(--color-badge-green-text)]',
  LATE: 'text-[color:var(--color-badge-orange-text)]',
  ABSENT: 'text-gray-400',
  DONE: 'text-[color:var(--color-badge-purple-text)]',
};

const statusLabels: Record<AttendanceStatus, string> = {
  WAITING: '출근 전',
  WORKING: '근무 중',
  LATE: '지각',
  ABSENT: '결근',
  DONE: '퇴근',
};

export default function EmployeeWorkStatus({ status, clockInTime }: Props) {
  const { chartData, centerText } = useMemo(() => {
    if (status === 'WAITING' || status === 'ABSENT') {
      return {
        chartData: [{ value: 1, fill: CHART_COLORS.track }],
        centerText: '-',
      };
    }

    if (status === 'DONE') {
      return {
        chartData: [{ value: 1, fill: CHART_COLORS.done }],
        centerText: '완료',
      };
    }

    // WORKING / LATE
    const now = new Date();
    const endTime = new Date();
    // 백엔드 연동 시 교체: scheduledEndTime 사용
    endTime.setHours(SCHEDULED_END_HOUR, SCHEDULED_END_MIN, 0, 0);

    const start = clockInTime ?? now;
    const elapsed = Math.max(0, (now.getTime() - start.getTime()) / 60000);
    const remaining = Math.max(0, (endTime.getTime() - now.getTime()) / 60000);
    const activeColor =
      status === 'LATE' ? CHART_COLORS.late : CHART_COLORS.working;

    const h = Math.floor(remaining / 60);
    const m = Math.floor(remaining % 60);
    const centerText =
      remaining > 0 ? `${h}:${String(m).padStart(2, '0')}` : '곧 퇴근';

    return {
      chartData:
        elapsed + remaining > 0
          ? [
              { value: elapsed, fill: activeColor },
              { value: remaining, fill: CHART_COLORS.trackActive },
            ]
          : [{ value: 1, fill: activeColor }],
      centerText,
    };
  }, [status, clockInTime]);

  return (
    <div
      className={`${bgColors[status]} flex-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-badge)]`}
    >
      <div className="flex flex-col items-center justify-center gap-[17px] px-[var(--space-3)] py-[var(--space-6)] h-full">
        {/* 도넛 차트 */}
        <div
          className="relative"
          style={{ width: CHART_SIZE, height: CHART_SIZE }}
        >
          <PieChart
            width={CHART_SIZE}
            height={CHART_SIZE}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <Pie
              data={chartData}
              cx={CX}
              cy={CX}
              innerRadius={INNER_RADIUS}
              outerRadius={OUTER_RADIUS}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            />
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className={`${textColors[status]} text-[10px] font-bold leading-none`}
            >
              {centerText}
            </span>
          </div>
        </div>

        {/* 상태 라벨 */}
        <span
          className={`${textColors[status]} text-[length:var(--text-md)] font-semibold text-center leading-tight`}
        >
          {statusLabels[status]}
        </span>
      </div>
    </div>
  );
}
