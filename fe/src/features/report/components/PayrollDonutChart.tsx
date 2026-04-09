import { Play } from 'lucide-react';
import { PieChart, Pie } from 'recharts';
import type { PayrollBreakdownItem } from '../types';

interface Props {
  breakdown: PayrollBreakdownItem[];
}

function formatCenterAmount(amount: number): string {
  if (amount >= 10000) {
    return `${Math.round(amount / 10000).toLocaleString()}만원`;
  }

  return `${amount.toLocaleString()}원`;
}

function getChangeMeta(changePercent?: number) {
  if (changePercent === undefined || !Number.isFinite(changePercent)) {
    return null;
  }

  if (changePercent === 0) {
    return {
      text: '변동 없음',
      color: 'var(--color-status-grey-dot)',
      showIcon: false,
      rotationClass: '',
    };
  }

  const isIncrease = changePercent > 0;

  return {
    text: `${Math.abs(changePercent)}% ${isIncrease ? '증가' : '감소'}`,
    color: isIncrease ? 'var(--color-status-green-dot)' : 'var(--color-danger)',
    showIcon: true,
    rotationClass: isIncrease ? '-rotate-90' : 'rotate-90',
  };
}

export default function PayrollDonutChart({ breakdown }: Props) {
  const chartData = breakdown.map((item) => ({
    ...item,
    fill: item.color,
  }));

  const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-6)]">
      <p className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)] font-bold mb-[var(--space-5)]">
        급여 항목별 분석
      </p>

      {/* 도넛 차트 */}
      <div className="flex justify-center mb-[var(--space-6)]">
        <div className="relative">
          <PieChart width={244} height={244}>
            <Pie
              data={chartData}
              cx={122}
              cy={122}
              innerRadius={72}
              outerRadius={108}
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
            <span className="text-[length:var(--text-lg)] text-[color:var(--color-text-primary)] font-bold text-center leading-tight px-[var(--space-2)]">
              {formatCenterAmount(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-col divide-y divide-[var(--color-border-light)]">
        {breakdown.map((item) => {
          const changeMeta = getChangeMeta(item.changePercent);

          return (
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
                {changeMeta && (
                  <span
                    className="flex items-center gap-[var(--space-1)] ml-[var(--space-3)] text-[length:var(--text-xs)] font-bold"
                    style={{ color: changeMeta.color }}
                  >
                    {changeMeta.showIcon && (
                      <Play
                        size={6}
                        className={changeMeta.rotationClass}
                        style={{
                          fill: changeMeta.color,
                          color: changeMeta.color,
                        }}
                        strokeWidth={0}
                      />
                    )}
                    {changeMeta.text}
                  </span>
                )}
              </div>
              <span className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)] font-bold">
                {item.amount.toLocaleString()}원
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
