import { Banknote, BadgeCheck, AlarmClockOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { mockMonthlyHighlights } from '../data/mockReport';
import type { MonthlyHighlightItem } from '../types';

const ICON_MAP: Record<
  MonthlyHighlightItem['iconType'],
  (color: string) => ReactNode
> = {
  salary: (color) => <Banknote size={22} color={color} strokeWidth={2} />,
  attendance: (color) => <BadgeCheck size={22} color={color} strokeWidth={2} />,
  late: (color) => <AlarmClockOff size={22} color={color} strokeWidth={2} />,
};

export default function MonthlyHighlights() {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-6)]">
      <p className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)] font-bold mb-[var(--space-5)]">
        이 달의 하이라이트
      </p>

      <div className="flex gap-[var(--space-3)]">
        {mockMonthlyHighlights.map((item) => (
          <div
            key={item.id}
            className="flex-1 flex flex-col gap-[var(--space-3)] rounded-[var(--radius-highlight)] px-[var(--space-4)] py-[var(--space-4)]"
            style={{ backgroundColor: item.bgColor }}
          >
            {ICON_MAP[item.iconType](item.iconColor)}
            <div>
              <p className="text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]">
                {item.category}
              </p>
              <p className="text-[length:var(--text-md2)] text-[color:var(--color-text-primary)] font-bold">
                {item.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
