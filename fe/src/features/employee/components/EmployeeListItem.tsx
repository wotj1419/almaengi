import type { KeyboardEvent } from 'react';
import Avatar from 'boring-avatars';
import { ChevronRight } from 'lucide-react';
import type { EmployeeRecord } from '@/features/employee/types/employeeRecord';

interface EmployeeListItemProps {
  item: EmployeeRecord;
  onOpen: (item: EmployeeRecord) => void;
  isInactive?: boolean;
}

// 직원 목록의 개별 카드 - 아바타, 이름, 근무 요약을 표시하고 클릭 시 상세 페이지로 이동
// isInactive=true이면 퇴사 직원용 흐린 스타일 적용
export default function EmployeeListItem({
  item,
  onOpen,
  isInactive,
}: EmployeeListItemProps) {
  // Enter/Space 키로도 상세 페이지 진입 가능 (접근성)
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onOpen(item);
  };

  return (
    <div
      className={`flex w-full items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-md)] border px-[var(--space-4)] py-[var(--space-2)] text-left shadow-[var(--shadow-badge)] ${
        isInactive
          ? 'border-[var(--color-border-light)] bg-[var(--color-bg-surface)]'
          : 'border-[var(--color-border-light)] bg-[var(--color-bg-base)]'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(item)}
        onKeyDown={handleKeyDown}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-[var(--space-4)]"
      >
        <Avatar size={48} name={item.avatarSeed} variant="beam" />
        <div className="min-w-0">
          <p
            className={`truncate text-[length:var(--text-md2)] font-bold ${
              isInactive
                ? 'text-[var(--color-text-muted)]'
                : 'text-[var(--color-text-primary)]'
            }`}
          >
            {item.name}
          </p>
          <p className="mt-[var(--space-0-5)] truncate text-[length:var(--text-xs)] font-bold text-[var(--color-text-muted)]">
            {item.workSummary ?? '근무 일정 미정'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-white)]"
        aria-label={`${item.name} 상세 보기`}
      >
        <ChevronRight
          size={16}
          color={
            isInactive
              ? 'var(--color-text-light)'
              : 'var(--color-text-placeholder)'
          }
        />
      </button>
    </div>
  );
}
