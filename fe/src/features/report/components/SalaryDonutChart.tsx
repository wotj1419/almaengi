import { Play } from 'lucide-react';
import { PieChart, Pie } from 'recharts';
import { mockSalaryBreakdown } from '../data/mockReport';

const chartData = mockSalaryBreakdown.map((item) => ({
  ...item,
  fill: item.color,
}));

export default function SalaryDonutChart() {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-6)]">
      <p className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)] font-bold mb-[var(--space-5)]">
        수당 항목별 분석
      </p>

      {/* 도넛 차트 */}
      <div className="flex justify-center mb-[var(--space-6)]">
        <div className="relative">
          <PieChart width={200} height={200}>
            <Pie
              data={chartData}
              cx={100}
              cy={100}
              innerRadius={57}
              outerRadius={83}
              dataKey="amount"
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            />
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
              총계
            </span>
            <span className="text-[length:var(--text-2xl)] text-[color:var(--color-text-primary)] font-bold">
              100%
            </span>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-col divide-y divide-[var(--color-border-light)]">
        {mockSalaryBreakdown.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-[var(--space-4)]"
          >
            <div className="flex items-center gap-[var(--space-3)]">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)]">
                {item.label}
              </span>
              {item.changePercent !== undefined && (
                <span className="flex items-center gap-[var(--space-1)] ml-[var(--space-3)] text-[length:var(--text-xs)] text-[color:var(--color-warning)] font-bold">
                  <Play
                    size={6}
                    className="-rotate-90"
                    style={{
                      fill: 'var(--color-warning)',
                      color: 'var(--color-warning)',
                    }}
                    strokeWidth={0}
                  />
                  {Math.abs(item.changePercent)}%
                </span>
              )}
            </div>
            <span className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)] font-bold">
              {item.amount.toLocaleString()}원
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
