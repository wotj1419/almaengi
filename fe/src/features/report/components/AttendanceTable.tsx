import type { AttendanceRecord } from '../types';

const HEADERS = ['이름', '출근', '지각', '결근', '시간', '연장', '야간'];

interface Props {
  records: AttendanceRecord[];
}

export default function AttendanceTable({ records }: Props) {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-6)]">
      <div className="flex items-center justify-between mb-[var(--space-5)]">
        <p className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)] font-bold">
          직원별 근태 비교
        </p>
        {/* <p className="text-[length:var(--text-xs)] text-[color:var(--color-text-muted)]">
          최근 30일 기준
        </p> */}
      </div>

      <div className="rounded-[var(--radius-sm)] overflow-hidden overflow-x-auto">
        {/* 헤더 */}
        <div
          className="grid grid-cols-7 min-w-[420px] py-[var(--space-3)] px-[var(--space-3)]"
          style={{ backgroundColor: 'var(--color-table-header-bg)' }}
        >
          {HEADERS.map((h) => (
            <p
              key={h}
              className="text-[length:var(--text-xs)] font-medium text-center"
              style={{ color: 'var(--color-table-header-text)' }}
            >
              {h}
            </p>
          ))}
        </div>

        {/* 데이터 행 */}
        {records.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-7 min-w-[420px] py-[var(--space-4)] px-[var(--space-3)]"
            style={{
              backgroundColor: row.isWarning
                ? 'var(--color-table-row-warning-bg)'
                : 'transparent',
            }}
          >
            <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-primary)] text-center font-medium">
              {row.name}
            </p>
            <p
              className="text-[length:var(--text-sm)] font-medium text-center"
              style={{
                color:
                  row.attendance >= 21
                    ? 'var(--color-table-value-good)'
                    : 'var(--color-text-primary)',
              }}
            >
              {row.attendance}일
            </p>
            <p
              className="text-[length:var(--text-sm)] font-medium text-center"
              style={{
                color:
                  row.late === 0
                    ? 'var(--color-table-value-good)'
                    : row.isWarning
                      ? 'var(--color-table-value-warning)'
                      : 'var(--color-text-primary)',
              }}
            >
              {row.late}
            </p>
            <p
              className="text-[length:var(--text-sm)] font-medium text-center"
              style={{
                color:
                  row.absent === 0
                    ? 'var(--color-table-value-good)'
                    : row.isWarning
                      ? 'var(--color-table-value-warning)'
                      : 'var(--color-text-primary)',
              }}
            >
              {row.absent}
            </p>
            <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-primary)] font-medium text-center">
              {row.hours}h
            </p>
            <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-primary)] font-medium text-center">
              {row.overtimeHours}h
            </p>
            <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-primary)] font-medium text-center">
              {row.nightHours}h
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
