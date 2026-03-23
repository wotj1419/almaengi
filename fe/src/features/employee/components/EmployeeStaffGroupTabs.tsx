import { STAFF_GROUP_LABEL } from '@/features/employee/constants/ui';
import type { StaffGroupKey } from '@/features/employee/types/employeeRecord';

interface EmployeeStaffGroupTabsProps {
  selectedGroup: StaffGroupKey;
  currentCount: number;
  resignedCount: number;
  onSelect: (group: StaffGroupKey) => void;
}

const STAFF_GROUPS: StaffGroupKey[] = ['CURRENT', 'RESIGNED'];

// StaffGroupKey에 따라 해당 그룹의 인원 수를 반환
const GROUP_COUNT_BY_KEY = (
  group: StaffGroupKey,
  currentCount: number,
  resignedCount: number
) => (group === 'CURRENT' ? currentCount : resignedCount);

// 현재 직원 / 퇴사 직원 탭 전환 컴포넌트 - 선택된 탭에 하이라이트 + 인원 수 뱃지 표시
export default function EmployeeStaffGroupTabs({
  selectedGroup,
  currentCount,
  resignedCount,
  onSelect,
}: EmployeeStaffGroupTabsProps) {
  return (
    <div className="mb-[var(--space-3)] grid grid-cols-2 gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] p-[var(--space-1)]">
      {STAFF_GROUPS.map((group) => {
        const isSelected = selectedGroup === group;
        const count = GROUP_COUNT_BY_KEY(group, currentCount, resignedCount);

        return (
          <button
            key={group}
            type="button"
            onClick={() => onSelect(group)}
            className={`inline-flex items-center justify-center gap-[var(--space-1)] rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-2)] text-[length:var(--text-xs)] font-bold ${
              isSelected
                ? 'bg-[var(--color-bg-white)] text-[var(--color-text-primary)] shadow-[var(--shadow-badge)]'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            <span>{STAFF_GROUP_LABEL[group]}</span>
            <span
              className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-[6px] py-[1px] text-[10px] ${
                isSelected
                  ? 'bg-[var(--color-primary)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-bg-base)] text-[var(--color-text-muted)]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
