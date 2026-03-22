import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

export default function AlertCard({ icon, iconBg, title, description }: Props) {
  return (
    <div className="flex items-center gap-[var(--space-5)] bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] px-[var(--space-6)] py-[var(--space-5)]">
      <div
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-[var(--space-1-5)]">
        <p className="text-[length:var(--text-ml)] text-[color:var(--color-text-primary)] font-bold">
          {title}
        </p>
        <p className="text-[length:var(--text-base)] text-[color:var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
          {description}
        </p>
      </div>
    </div>
  );
}
