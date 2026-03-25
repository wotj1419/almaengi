import Avatar from 'boring-avatars';
import dayjs from 'dayjs';
import { FileText } from 'lucide-react';
import type { Payroll } from '../types';

interface Props {
  payroll: Payroll;
  onViewStatement: () => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export default function PayrollEmployeeCard({
  payroll,
  onViewStatement,
}: Props) {
  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] px-[var(--space-5)] py-[var(--space-5)]">
      <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
        <div className="shrink-0 rounded-full overflow-hidden">
          <Avatar name={payroll.employee_name} size={34} variant="beam" />
        </div>
        <div className="flex flex-col gap-[var(--space-1)]">
          <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)]">
            {payroll.employee_name}
          </span>
          {(() => {
            const isPast = dayjs(payroll.target_month).isBefore(
              dayjs(),
              'month'
            );
            const isPaid = payroll.is_approved || isPast;
            const payDate = dayjs(payroll.target_month)
              .add(1, 'month')
              .date(5)
              .format('YYYY.MM.DD');
            return isPaid ? (
              <span className="self-start px-[var(--space-1-5)] py-[var(--space-0-5)] rounded-[var(--radius-sm)] bg-[var(--color-badge-approvable-bg)] text-[length:var(--text-2xs)] font-semibold text-[color:var(--color-badge-approvable-text)]">
                {payDate} 지급 완료
              </span>
            ) : (
              <span className="self-start px-[var(--space-1-5)] py-[var(--space-0-5)] rounded-[var(--radius-sm)] bg-[var(--color-status-grey-bg)] text-[length:var(--text-2xs)] font-semibold text-[color:var(--color-status-grey-dot)]">
                {payDate} 지급 예정
              </span>
            );
          })()}
        </div>
      </div>
      <div className="flex items-center justify-between mb-[var(--space-5)]">
        <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-sub)]">
          실수령액
        </span>
        <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)]">
          {formatAmount(payroll.net_pay)}
        </span>
      </div>
      <button
        onClick={() => onViewStatement()}
        className="w-full py-[var(--space-4)] bg-[var(--color-badge-orange-bg)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] font-bold text-[color:var(--color-badge-orange-text)] cursor-pointer flex items-center justify-center gap-[var(--space-2)]"
      >
        <FileText size={15} strokeWidth={2} />
        급여 명세서 보기
      </button>
    </div>
  );
}
