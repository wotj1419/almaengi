export type ReportTab = 'salary' | 'staff' | 'auction';

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'salary', label: '급여 현황' },
  { id: 'staff', label: '직원 비교' },
  { id: 'auction', label: '경매 인사이트' },
];

interface Props {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
}

export default function ReportTabBar({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex gap-[var(--space-2)] px-[var(--space-5)] py-[var(--space-2)]">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-[var(--space-5)] py-[var(--space-2)] rounded-full text-[length:var(--text-base)] cursor-pointer transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-[var(--color-primary)] text-[color:var(--color-text-primary)] font-bold'
                : 'bg-[var(--color-bg-white)] text-[color:var(--color-text-muted)] border border-[var(--color-border-muted)] font-medium'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
