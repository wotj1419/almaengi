import Avatar from 'boring-avatars';
import type { EmployeeRecord } from '@/features/employee/types/employeeRecord';

interface EmployeePendingInviteItemProps {
  item: EmployeeRecord;
  onApprove: (id: number) => void;
  onDelete: (id: number) => void;
}

// 초대 대기 직원 항목 - 아바타, 이름, 연락처를 표시하고 승인/삭제 버튼 제공
export default function EmployeePendingInviteItem({
  item,
  onApprove,
  onDelete,
}: EmployeePendingInviteItemProps) {
  return (
    <li className="flex items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-[var(--space-4)] py-[var(--space-2)] shadow-[var(--shadow-badge)]">
      <div className="flex min-w-0 items-center gap-[var(--space-3)]">
        <Avatar size={46} name={item.avatarSeed} variant="beam" />
        <div className="min-w-0">
          <p className="truncate text-[length:var(--text-base)] font-semibold text-[var(--color-text-primary)]">
            {item.name} 직원
          </p>
          <p className="mt-[var(--space-0-5)] text-[length:var(--text-sm)] font-medium text-[var(--color-text-muted)]">
            {item.phone ?? '연락처 미등록'}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-[var(--space-2)]">
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--color-border-muted)] px-[var(--space-4)] text-[length:var(--text-base)] font-bold text-[var(--color-text-muted)]"
        >
          삭제
        </button>
        <button
          type="button"
          onClick={() => onApprove(item.id)}
          className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--color-primary)] px-[var(--space-4)] text-[length:var(--text-base)] font-bold text-[var(--color-text-primary)]"
        >
          승인
        </button>
      </div>
    </li>
  );
}
