import type { EmployeeAttendanceStatsData } from '../utils/employeeReportMapper';

interface Props {
  stats: EmployeeAttendanceStatsData;
}

export default function EmployeeAttendanceStats({ stats }: Props) {
  const row1 = [
    { label: '출근', value: `${stats.attendanceCount}일` },
    { label: '지각', value: `${stats.lateCount}`, warn: stats.lateCount > 0 },
    {
      label: '결근',
      value: `${stats.absentCount}`,
      warn: stats.absentCount > 0,
    },
  ];
  const row2 = [
    { label: '총 시간', value: `${stats.totalWorkHours}h` },
    { label: '연장', value: `${stats.overtimeHours}h` },
    { label: '야간', value: `${stats.nightHours}h` },
  ];

  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-6)] pt-[var(--space-5)] pb-[var(--space-7)] flex flex-col gap-[var(--space-4)]">
      <h3 className="text-[length:var(--text-ml)] font-bold text-[color:var(--color-text-primary)]">
        이번 달 근태
      </h3>
      <div className="grid grid-cols-3 gap-[var(--space-2)]">
        {row1.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-[var(--space-0-5)]"
          >
            <span className="text-[length:var(--text-xs)] font-medium text-[color:var(--color-text-muted)]">
              {item.label}
            </span>
            <span
              className={`text-[length:var(--text-lg)] font-bold ${
                item.warn
                  ? 'text-[color:var(--color-warning)]'
                  : 'text-[color:var(--color-text-primary)]'
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
      <div className="h-px bg-[var(--color-border-light)]" />
      <div className="grid grid-cols-3 gap-[var(--space-2)]">
        {row2.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-[var(--space-0-5)]"
          >
            <span className="text-[length:var(--text-xs)] font-medium text-[color:var(--color-text-muted)]">
              {item.label}
            </span>
            <span className="text-[length:var(--text-lg)] font-bold text-[color:var(--color-text-primary)]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
