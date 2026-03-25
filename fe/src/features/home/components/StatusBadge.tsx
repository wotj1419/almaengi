import { type LucideIcon } from 'lucide-react';

interface StatusBadgeProps {
  count: number;
  label: string;
  color: 'green' | 'orange' | 'purple';
  onClick?: () => void;
  icon?: LucideIcon;
}

const bgColors = {
  green: 'bg-[var(--color-badge-green-bg)]',
  orange: 'bg-[var(--color-badge-orange-bg)]',
  purple: 'bg-[var(--color-badge-purple-bg)]',
};

const textColors = {
  green: 'text-[color:var(--color-badge-green-text)]',
  orange: 'text-[color:var(--color-badge-orange-text)]',
  purple: 'text-[color:var(--color-badge-purple-text)]',
};

export default function StatusBadge({
  count,
  label,
  color,
  onClick,
  icon: Icon,
}: StatusBadgeProps) {
  return (
    <div
      className={`${bgColors[color]} flex-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-badge)] cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center gap-[17px] px-[var(--space-3)] py-[var(--space-6)] h-full">
        {/* 숫자 또는 아이콘 원형 뱃지 */}
        <div className="flex items-center justify-center bg-white rounded-full shadow-[var(--shadow-badge)] size-[50px]">
          {Icon ? (
            <Icon size={24} className={textColors[color]} />
          ) : (
            <span
              className={`${textColors[color]} text-[length:var(--text-2xl)] font-bold leading-tight`}
            >
              {count}
            </span>
          )}
        </div>
        {/* 라벨 */}
        <span
          className={`${textColors[color]} text-[length:var(--text-md)] font-semibold text-center leading-tight`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
