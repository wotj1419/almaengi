import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import stampPaid from '@/assets/images/stamp-paid.png';

interface Props {
  totalNetPay: number;
  employeeCount: number;
  totalWorkMinutes: number;
  nightWorkMinutes: number;
  overtimeMinutes: number;
  isPaid: boolean;
  isAutoTransferOn: boolean;
  onAutoTransferToggle?: () => void;
  onManualTransfer?: () => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

export default function PayrollSummaryCard({
  totalNetPay,
  employeeCount,
  totalWorkMinutes,
  nightWorkMinutes,
  overtimeMinutes,
  isPaid,
  isAutoTransferOn,
  onAutoTransferToggle,
  onManualTransfer,
}: Props) {
  const navigate = useNavigate();

  // D-Day 계산 (하드코딩: 급여일 21일)
  const PAY_DAY = 21;
  const today = new Date();
  const thisMonthPayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    PAY_DAY
  );
  const nextMonthPayDate = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    PAY_DAY
  );
  const payDate =
    today <= thisMonthPayDate ? thisMonthPayDate : nextMonthPayDate;
  const dDay = Math.ceil(
    (payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-5)] flex flex-col gap-[var(--space-5)]">
      {/* 총 급여액 + D-day / 승인 배지 */}
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <div className="flex flex-col gap-[var(--space-1)]">
          <span className="text-[length:var(--text-xl)] font-semibold text-[color:var(--color-text-sub)] tracking-[var(--tracking-tight)]">
            총 급여액
          </span>
          <span className="text-[length:var(--text-2-5xl)] font-bold text-[color:var(--color-text-primary)] tracking-[var(--tracking-tighter)]">
            {formatAmount(totalNetPay)}
          </span>
        </div>

        {isPaid ? (
          <img
            src={stampPaid}
            alt="지급완료"
            className="w-[75px] h-[75px] rotate-[-12deg] opacity-80"
          />
        ) : (
          <span className="px-[var(--space-2)] py-[var(--space-0-5)] rounded-[var(--radius-xs)] text-[length:var(--text-2xs)] font-bold whitespace-nowrap bg-[var(--color-status-grey-bg)] text-[color:var(--color-status-grey-dot)]">
            D-{dDay}
          </span>
        )}
      </div>

      {/* 근무 시간 요약 */}
      <div className="flex flex-col gap-[var(--space-2)]">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-sub)]">
            총 근무자
          </span>
          <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
            {employeeCount}명
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-sub)]">
            총 근무
          </span>
          <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
            {formatTime(totalWorkMinutes)}
          </span>
        </div>
        {nightWorkMinutes > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-sub)]">
              야간 근무
            </span>
            <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
              {formatTime(nightWorkMinutes)}
            </span>
          </div>
        )}
        {overtimeMinutes > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-sub)]">
              연장 근무
            </span>
            <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
              {formatTime(overtimeMinutes)}
            </span>
          </div>
        )}
      </div>

      {/* 버튼 영역: 분석 리포트 + 수동 이체 */}
      <div className="flex gap-[var(--space-3)]">
        <button
          onClick={() => navigate(ROUTES.REPORT)}
          className="flex-1 py-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)] cursor-pointer"
        >
          분석 리포트
        </button>
        <button
          onClick={onManualTransfer}
          className="flex-1 py-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-badge-green-bg)] text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)] cursor-pointer"
        >
          수동 이체
        </button>
      </div>

      {/* 예약 이체 토글 */}
      <div className="flex items-center justify-between py-[var(--space-3)] px-[var(--space-4)] rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)]">
        <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
          예약 이체
        </span>
        <button
          onClick={onAutoTransferToggle}
          className={`relative shrink-0 w-[44px] h-[24px] rounded-full transition-colors cursor-pointer ${
            isAutoTransferOn
              ? 'bg-[var(--color-primary)]'
              : 'bg-[var(--color-status-grey-bg)]'
          }`}
        >
          <span
            className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow transition-transform ${
              isAutoTransferOn ? 'translate-x-[20px]' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
