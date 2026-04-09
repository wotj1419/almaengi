import Avatar from 'boring-avatars';
import type { PayrollRankingItem } from '../types';

const RANK_COLORS = [
  'var(--color-primary)',
  'var(--color-action-schedule)',
  'var(--color-ranking-3rd)',
  'var(--color-text-light)',
];

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

interface Props {
  ranking: PayrollRankingItem[];
}

export default function PayrollRankingCard({ ranking }: Props) {
  const maxAmount = ranking[0]?.amount ?? 1;

  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-6)]">
      <p className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)] font-bold mb-[var(--space-5)]">
        직원별 급여 랭킹
      </p>

      <div className="flex flex-col gap-[var(--space-8)] mb-[var(--space-5)]">
        {ranking.map((item, index) => {
          const color =
            RANK_COLORS[Math.min(index, 3)] ?? 'var(--color-text-light)';
          const isMuted = index >= 3;
          const barWidth = Math.round((item.amount / maxAmount) * 100);
          const textColor =
            index === 0
              ? 'var(--color-text-primary)'
              : isMuted
                ? 'var(--color-text-light)'
                : 'var(--color-text-primary)';

          return (
            <div key={item.id} className="flex flex-col gap-[var(--space-2)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--space-3)]">
                  <span
                    className="text-[length:var(--text-sm)] font-bold text-center"
                    style={{
                      color: index === 0 ? 'var(--color-text-primary)' : color,
                    }}
                  >
                    {item.rank}위
                  </span>
                  <div className="shrink-0 rounded-full overflow-hidden">
                    <Avatar name={item.name} size={28} variant="beam" />
                  </div>
                  <span
                    className="text-[length:var(--text-sm)] font-medium"
                    style={{ color: textColor }}
                  >
                    {item.name}
                  </span>
                </div>
                <span
                  className="text-[length:var(--text-sm)] font-bold"
                  style={{ color: textColor }}
                >
                  {formatAmount(item.amount)}
                </span>
              </div>

              <div
                className="w-full rounded-full"
                style={{
                  height: '8px',
                  backgroundColor: 'var(--color-border-light)',
                }}
              >
                <div
                  className="rounded-full h-full"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
