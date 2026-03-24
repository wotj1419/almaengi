import type { ContractStatus } from '@/features/documents/data/mockContracts';
import { getContractStatusLabel } from '@/features/documents/data/mockContracts';

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

const STATUS_CLASS: Record<ContractStatus, string> = {
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
      {getContractStatusLabel(status)}
    </span>
  );
}
