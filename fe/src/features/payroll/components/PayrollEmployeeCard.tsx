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

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

export default function PayrollEmployeeCard({
  payroll,
  onViewStatement,
}: Props) {
  // 배지 상태: 지급 예정 → 승인 완료 → 지급 완료
  const isTransferred = payroll.is_transferred;
  const isApproved = payroll.is_approved;

  // 하드코딩: 급여일 21일 (다음달 21일 지급)
  const PAY_DAY = 21;
  const paidDateLabel = dayjs(payroll.target_month)
    .add(1, 'month')
    .date(PAY_DAY)
    .format('M월 D일');

  const transferredDateLabel = payroll.transferred_at
    ? dayjs(payroll.transferred_at).format('M월 D일')
    : '';

  const badgeConfig = isTransferred
    ? {
        label: `${transferredDateLabel} 지급 완료`,
        style:
          'bg-[var(--color-badge-green-bg)] text-[color:var(--color-status-badge-green-text)]',
      }
    : isApproved
      ? {
          label: `${paidDateLabel} 승인 완료`,
          style:
            'bg-[var(--color-badge-orange-bg)] text-[color:var(--color-badge-orange-text)]',
        }
      : {
          label: `${paidDateLabel} 지급 예정`,
          style:
            'bg-[var(--color-status-grey-bg)] text-[color:var(--color-status-grey-dot)]',
        };

  return (
    <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] px-[var(--space-5)] py-[var(--space-5)]">
      {/* 이름 + 지급완료 배지 */}
      <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
        <div className="shrink-0 rounded-full overflow-hidden">
          <Avatar name={payroll.employee_name} size={34} variant="beam" />
        </div>
        <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)]">
          {payroll.employee_name}
        </span>
        <span
          className={`ml-auto px-[var(--space-1-5)] py-[var(--space-0-5)] rounded-[var(--radius-sm)] text-[length:var(--text-2xs)] font-semibold whitespace-nowrap ${badgeConfig.style}`}
        >
          {badgeConfig.label}
        </span>
      </div>

      {/* 급여액 */}
      <div className="flex items-center justify-between mb-[var(--space-3)]">
        <span className="text-[length:var(--text-md)] font-bold text-[color:var(--color-text-sub)]">
          {isTransferred || isApproved ? '실수령액' : '예상 급여액'}
        </span>
        <span className="text-[length:var(--text-xl)] font-bold text-[color:var(--color-text-primary)]">
          {formatAmount(payroll.net_pay)}
        </span>
      </div>

      {/* 근무 시간 요약 */}
      <div className="flex flex-col gap-[var(--space-2)] mb-[var(--space-5)]">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-muted)]">
            시급
          </span>
          <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-muted)]">
            {formatAmount(payroll.hourly_wage)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-muted)]">
            총 근무
          </span>
          <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-muted)]">
            {formatTime(payroll.total_work_minutes)}
          </span>
        </div>
        {payroll.night_work_minutes > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-muted)]">
              야간 근무
            </span>
            <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-muted)]">
              {formatTime(payroll.night_work_minutes)}
            </span>
          </div>
        )}
      </div>

      {/* 급여 명세서 보기 버튼 */}
      <button
        onClick={() => onViewStatement()}
        className="w-full py-[var(--space-4)] bg-[var(--color-badge-orange-bg)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] font-bold text-[color:var(--color-badge-orange-text)] cursor-pointer flex items-center justify-center gap-[var(--space-2)]"
      >
        <FileText size={15} strokeWidth={2} />
        급여명세서 보기
      </button>
    </div>
  );
}
