import type { PeakTimeItem } from '../types';

interface Props {
  peakTimes: PeakTimeItem[];
}

export default function PeakTimeCard({ peakTimes }: Props) {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)]">
      <div className="flex items-center justify-between px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-4)]">
        <p className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)] font-bold">
          경매 피크타임 TOP 6
        </p>
        <p className="text-[length:var(--text-xs)] text-[color:var(--color-text-muted)]">
          실시간
        </p>
      </div>

      <div className="flex flex-col gap-[var(--space-3)] px-[var(--space-5)] pb-[var(--space-5)]">
        {peakTimes.map((item) => (
          <div
            key={item.id}
            className="flex items-stretch rounded-[var(--radius-2xl)] bg-[var(--color-bg-white)] overflow-hidden"
          >
            <div
              className="w-1 shrink-0"
              style={{ backgroundColor: item.barColor }}
            />
            <div className="flex items-center gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-4)] flex-1">
              <span
                className="text-[length:var(--text-base)] font-bold w-4 text-center shrink-0"
                style={{ color: item.barColor }}
              >
                {item.rank}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[length:var(--text-base)] text-[color:var(--color-text-primary)] font-bold">
                  {item.timeRange}
                </p>
                <p className="text-[length:var(--text-xs)] text-[color:var(--color-text-muted)] mt-[var(--space-0-5)]">
                  {item.description}
                </p>
              </div>

              <span
                className="text-[length:var(--text-xs)] font-bold px-[var(--space-3)] py-[var(--space-1)] rounded-full shrink-0"
                style={{
                  backgroundColor: item.badgeBg,
                  color: item.badgeTextColor,
                }}
              >
                {item.count}건
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
