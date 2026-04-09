import type { KeyboardEvent } from 'react';
import Avatar from 'boring-avatars';
import { ChevronRight } from 'lucide-react';
import type {
  EmployeeRecord,
  UIEmployeeStatus,
} from '@/features/employee/types/employeeRecord';

// 백엔드 상태를 화면용 텍스트로 매핑
const STATUS_LABEL_MAP: Record<UIEmployeeStatus, string> = {
  WORKING: '재직',
  RESTING: '휴직',
  BEST: '우수',
  RESIGNED: '퇴사',
  ON_LEAVE: '휴직',
  INVITED: '초대 대기',
};

// 백엔드 상태를 배지 색상으로 매핑
const STATUS_COLOR_MAP: Record<UIEmployeeStatus, { bg: string; text: string }> =
  {
    WORKING: {
      bg: 'bg-[var(--color-badge-green-bg)]',
      text: 'text-[var(--color-status-green-dot)]',
    },
    RESTING: {
      bg: 'bg-[var(--color-badge-blue-bg)]',
      text: 'text-[var(--color-status-blue-dot)]',
    },
    BEST: { bg: 'bg-[var(--color-badge-orange-bg)]', text: 'text-orange-600' },
    RESIGNED: {
      bg: 'bg-[var(--color-badge-gray-bg)]',
      text: 'text-[var(--color-text-muted)]',
    },
    ON_LEAVE: {
      bg: 'bg-[var(--color-badge-blue-bg)]',
      text: 'text-[var(--color-status-blue-dot)]',
    },
    INVITED: {
      bg: 'bg-[var(--color-badge-gray-bg)]',
      text: 'text-[var(--color-text-muted)]',
    },
  };

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
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`truncate text-[length:var(--text-md2)] font-bold ${
                isInactive
                  ? 'text-[var(--color-text-muted)]'
                  : 'text-[var(--color-text-primary)]'
              }`}
            >
              {item.name}
            </p>
            <span
              className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                STATUS_COLOR_MAP[item.status]?.bg ?? 'bg-gray-100'
              } ${STATUS_COLOR_MAP[item.status]?.text ?? 'text-gray-600'}`}
            >
              {STATUS_LABEL_MAP[item.status] ?? item.status}
            </span>
          </div>
          <p className="mt-[var(--space-0-5)] truncate text-[length:var(--text-xs)] font-bold text-[var(--color-text-muted)]">
            {item.position ?? item.workSummary ?? '근무 일정 미정'}
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
