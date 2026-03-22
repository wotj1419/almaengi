import { Play } from 'lucide-react';
import type { SummaryCard as SummaryCardType } from '../types';

interface Props {
  card: SummaryCardType;
}

export default function SummaryCard({ card }: Props) {
  const { title, mainValue, subText, subTextVariant, trend, trendType } = card;

  const isNegative = trendType === 'negative';
  const trendColor = isNegative
    ? 'var(--color-danger)'
    : 'var(--color-warning)';
  const triangleRotation = isNegative ? 'rotate-90' : '-rotate-90';

  const subTextColor =
    subTextVariant === 'info'
      ? 'text-[color:var(--color-action-schedule)]'
      : 'text-[color:var(--color-warning)]';

  return (
    <div className="flex-none w-[140px] flex flex-col gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] px-[var(--space-4)] py-[var(--space-4)]">
      <p className="text-[length:var(--text-xs)] text-[color:var(--color-text-muted)] font-medium">
        {title}
      </p>

      <p className="text-[length:var(--text-lg)] text-[color:var(--color-text-primary)] font-bold leading-tight">
        {mainValue}
      </p>

      {trend && (
        <div className="flex items-center gap-[var(--space-0-5)]">
          <Play
            size={6}
            className={triangleRotation}
            style={{ fill: trendColor, color: trendColor }}
            strokeWidth={0}
          />
          <p
            className="text-[length:var(--text-sm)] font-medium"
            style={{ color: trendColor }}
          >
            {trend}
          </p>
        </div>
      )}

      {subText && (
        <p
          className={`text-[length:var(--text-sm)] font-medium ${subTextColor}`}
        >
          {subText}
        </p>
      )}
    </div>
  );
}
