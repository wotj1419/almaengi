import { mockAuctionSummary } from '../data/mockReport';

export default function AuctionSummaryCard() {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-xl)] shadow-[var(--shadow-form-card)] border border-[var(--color-border-light)] overflow-hidden">
      <div className="px-[var(--space-5)] py-[var(--space-4)] border-b border-[var(--color-table-header-bg)]">
        <p className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-medium">
          이 달의 경매 요약
        </p>
      </div>

      <div className="flex gap-[var(--space-3)] px-[var(--space-5)] py-[var(--space-5)]">
        {mockAuctionSummary.map((item) => (
          <div
            key={item.id}
            className="flex-1 flex flex-col items-center gap-[var(--space-3)] rounded-[var(--radius-xl)] px-[var(--space-4)] py-[var(--space-4)]"
            style={{ backgroundColor: item.bgColor }}
          >
            <p
              className="text-[length:var(--text-sm)] font-medium"
              style={{ color: item.labelColor }}
            >
              {item.label}
            </p>
            <p
              className="text-[length:var(--text-ml)] font-medium"
              style={{ color: item.valueColor }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
