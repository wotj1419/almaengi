import type { UIContractStatus } from '@/api/contract';

interface ContractStatusBadgeProps {
  status: UIContractStatus;
}

const STATUS_LABEL: Record<UIContractStatus, string> = {
  REQUESTING: '요청중',
  PENDING_APPROVAL: '승인 대기',
  APPROVED: '승인 완료',
};

const STATUS_CLASS: Record<UIContractStatus, string> = {
  REQUESTING:
    'bg-[var(--color-status-orange-bg)] text-[var(--color-status-orange-dot)] border-[var(--color-status-orange-border)]',
  PENDING_APPROVAL:
    'bg-[var(--color-status-purple-bg)] text-[var(--color-status-purple-dot)] border-[var(--color-status-purple-border)]',
  APPROVED:
    'bg-[var(--color-status-green-bg)] text-[var(--color-status-green-dot)] border-[var(--color-status-green-border)]',
};

export default function ContractStatusBadge({
  status,
}: ContractStatusBadgeProps) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-[var(--space-3)] text-[length:var(--text-xs)] font-bold ${STATUS_CLASS[status]}`.trim()}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
