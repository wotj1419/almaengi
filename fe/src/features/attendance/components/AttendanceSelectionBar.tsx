import { Check } from 'lucide-react';

interface Props {
  isAllSelected: boolean;
  onSelectAll: () => void;
  onCancel: () => void;
}

export default function AttendanceSelectionBar({
  isAllSelected,
  onSelectAll,
  onCancel,
}: Props) {
  return (
    <div className="flex items-center px-[var(--space-5)] py-[var(--space-3)] bg-[var(--color-bg-base)]">
      <button
        onClick={onSelectAll}
        className="flex items-center gap-[var(--space-2)] cursor-pointer"
      >
        <div
          className={`w-[var(--size-checkbox)] h-[var(--size-checkbox)] rounded-full border flex items-center justify-center ${
            isAllSelected
              ? 'border-[var(--color-text-sub)] bg-[var(--color-select-all-checked-bg)]'
              : 'border-[var(--color-text-sub)] bg-[var(--color-bg-white)]'
          }`}
        >
          {isAllSelected && (
            <Check size={9} strokeWidth={3} color="var(--color-text-sub)" />
          )}
        </div>
        <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-sub)] font-medium leading-[var(--leading-normal)]">
          전체 선택
        </span>
      </button>
      <button onClick={onCancel} className="ml-auto cursor-pointer">
        <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-sub)] font-medium leading-[var(--leading-normal)]">
          취소
        </span>
      </button>
    </div>
  );
}
