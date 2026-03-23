import type { ReactNode } from 'react';

interface EmployeeSectionCardProps {
  title: string;
  count: number;
  children: ReactNode;
}

// 직원 목록 섹션 래퍼 - 제목 + 인원 수 헤더와 children 콘텐츠를 카드 형태로 감싼다
export default function EmployeeSectionCard({
  title,
  count,
  children,
}: EmployeeSectionCardProps) {
  return (
    <section className="rounded-[var(--radius-xl)] bg-[var(--color-bg-white)] px-[var(--space-4)] py-[var(--space-4)] shadow-[var(--shadow-card)]">
      <header className="mb-[var(--space-3)] flex items-center justify-between">
        <h2 className="text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
          {title}
        </h2>
        <span className="text-[length:var(--text-xs)] font-medium text-[var(--color-text-placeholder)]">
          총 {count}명
        </span>
      </header>
      {children}
    </section>
  );
}
