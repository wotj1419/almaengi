import { ChevronDown, FileText } from 'lucide-react';
import { useState } from 'react';
import type { PayslipMonthGroup } from '@/features/documents/data/mockDocuments';

interface PayslipMonthAccordionProps {
  year: number;
  groups: PayslipMonthGroup[];
  onSelectPayslip: (payslipId: string) => void;
}

function MonthHeader({
  year,
  month,
  count,
  expanded,
  onClick,
}: {
  year: number;
  month: number;
  count: number;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] px-[var(--space-4)] py-[var(--space-4)] text-left"
    >
      <div className="flex items-center gap-[var(--space-2)]">
        <p className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
          {year}년 {month}월
        </p>
        <span className="rounded-full bg-[var(--color-primary)] px-[var(--space-2)] py-[var(--space-1)] text-[length:var(--text-xs)] font-bold text-[var(--color-text-primary)]">
          {count}건
        </span>
      </div>
      <ChevronDown
        size={18}
        className={`text-[var(--color-text-muted)] transition-transform ${
          expanded ? 'rotate-180' : ''
        }`}
      />
    </button>
  );
}

export default function PayslipMonthAccordion({
  year,
  groups,
  onSelectPayslip,
}: PayslipMonthAccordionProps) {
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>(
    {}
  );

  const handleToggleMonth = (month: number) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }));
  };

  if (groups.length === 0) {
    return (
      <section className="flex h-full min-h-[320px] flex-1 flex-col items-center justify-center px-[var(--space-5)] text-center">
        <div className="mb-[var(--space-4)] inline-flex h-[var(--size-empty-icon-inner)] w-[var(--size-empty-icon-inner)] items-center justify-center rounded-full bg-[var(--color-empty-icon-outer)]">
          <FileText size={28} color="var(--color-icon-muted)" />
        </div>
        <p className="text-[length:var(--text-md2)] font-medium text-[var(--color-empty-text-sub)]">
          {year}년 급여명세서가 없습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-[var(--space-3)]">
      {groups.map((group) => {
        const isExpanded = expandedMonths[group.month] ?? true;
        return (
          <article
            key={`${year}-${group.month}`}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-3)] shadow-[var(--shadow-form-card)]"
          >
            <MonthHeader
              year={year}
              month={group.month}
              count={group.items.length}
              expanded={isExpanded}
              onClick={() => handleToggleMonth(group.month)}
            />

            {isExpanded && (
              <div className="mt-[var(--space-3)] space-y-[var(--space-2)]">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectPayslip(item.id)}
                    className="flex w-full items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border-light)] px-[var(--space-4)] py-[var(--space-3)] text-left"
                  >
                    <p className="min-w-0 break-words text-[length:var(--text-base)] font-bold text-[var(--color-text-primary)]">
                      {item.title}
                    </p>
                    <span className="shrink-0 rounded-full bg-[var(--color-status-green-bg)] px-[var(--space-2)] py-[var(--space-1)] text-[length:var(--text-xs)] font-bold text-[var(--color-status-green-dot)]">
                      {item.employeeName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
