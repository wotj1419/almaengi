import type { ReactNode } from 'react';

interface EmployeeQuickActionCardProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  iconColorClassName?: string;
  iconBackgroundClassName?: string;
}

// 재사용 가능한 퀵 액션 카드 - 아이콘 + 라벨로 구성된 버튼 (신규직원 초대, 근로계약서 작성 등)
export default function EmployeeQuickActionCard({
  label,
  icon,
  onClick,
  iconColorClassName,
  iconBackgroundClassName,
}: EmployeeQuickActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-full items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] px-[var(--space-3)] py-[var(--space-2)] text-left shadow-[var(--shadow-form-card)]"
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${iconBackgroundClassName ?? 'bg-[var(--color-bg-surface)]'} ${iconColorClassName ?? 'text-[var(--color-text-secondary)]'}`}
      >
        {icon}
      </span>
      <span className="whitespace-nowrap text-[length:var(--text-base)] font-medium text-[var(--color-text-primary)]">
        {label}
      </span>
    </button>
  );
}
