interface Props {
  totalNetPay: number;
  onBulkSend?: () => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export default function PayrollSummaryCard({ totalNetPay, onBulkSend }: Props) {
  return (
    <div className="w-full pl-[var(--space-5)] pr-[var(--space-5)] pb-[var(--space-7)] flex items-center justify-between">
      <p className="text-[length:var(--text-xl)] font-bold text-[color:var(--color-text-primary)] leading-tight">
        {formatAmount(totalNetPay)}
      </p>
      <button
        onClick={onBulkSend}
        className="px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-sm)] bg-[var(--color-badge-green-bg)] text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)] cursor-pointer"
      >
        급여 일괄 송금
      </button>
    </div>
  );
}
