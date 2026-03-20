import { Check } from 'lucide-react';

export default function AttendanceEmptyState() {
  return (
    <div className="flex flex-col gap-[var(--space-7)] items-center">
      <div
        className="flex items-center justify-center rounded-full w-[var(--size-empty-outer)] h-[var(--size-empty-outer)]"
        style={{ backgroundColor: 'var(--color-empty-icon-outer)' }}
      >
        <div
          className="flex items-center justify-center rounded-full w-[var(--size-empty-middle)] h-[var(--size-empty-middle)]"
          style={{ backgroundColor: 'var(--color-empty-icon-outer)' }}
        >
          <div className="bg-[var(--color-primary)] flex items-center justify-center rounded-full w-[var(--size-empty-inner)] h-[var(--size-empty-inner)] shadow-[var(--shadow-badge)]">
            <Check
              size={28}
              strokeWidth={3}
              color="var(--color-text-primary)"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[var(--space-2)] items-center text-center">
        <h2 className="text-[length:var(--text-xl)] text-[color:var(--color-text-dark)] font-bold tracking-[var(--tracking-tighter)]">
          출퇴근 변경 요청이 없습니다
        </h2>
        <p className="text-[length:var(--text-md)] text-[color:var(--color-empty-text-sub)] font-medium">
          출퇴근 변경 요청이 들어오면 여기에 표시됩니다.
        </p>
      </div>
    </div>
  );
}
