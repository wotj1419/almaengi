import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { mockMonthlysalary } from '../data/mockReport';

interface Props {
  year: number;
  month: number;
}

function getLast6Months(
  year: number,
  month: number
): { year: number; month: number }[] {
  const base = dayjs(`${year}-${month}-01`);
  return Array.from({ length: 6 }, (_, i) => {
    const d = base.subtract(5 - i, 'month');
    return { year: d.year(), month: d.month() + 1 };
  });
}

export default function MonthlySalaryChart({ year, month }: Props) {
  const months = getLast6Months(year, month);

  const data = mockMonthlysalary.map((d, i) => ({
    month: `${months[i].month}월`,
    value: d.value,
    fill:
      i === mockMonthlysalary.length - 1
        ? 'var(--color-primary)'
        : 'var(--color-border-muted)',
  }));

  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-6)]">
      <div className="flex items-center justify-between mb-[var(--space-6)]">
        <p className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)] font-bold">
          월별 총 급여
        </p>
        <p className="text-[length:var(--text-xs)] text-[color:var(--color-text-muted)]">
          (단위: 만원)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} barSize={24} barCategoryGap="30%">
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
