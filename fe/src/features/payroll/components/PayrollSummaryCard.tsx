import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import stampPaid from '@/assets/images/stamp-paid.png';
import { getPayDay } from '@/api/payroll';
import useStoreStore from '@/stores/useStoreStore';

interface Props {
  totalNetPay: number;
  employeeCount: number;
  totalWorkMinutes: number;
  nightWorkMinutes: number;
  overtimeMinutes: number;
  isPaid: boolean;
  isAllApproved: boolean;
  isAutoTransferOn: boolean;
  onApproveToggle?: () => void;
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
  isAllApproved,
  isAutoTransferOn,
  onApproveToggle,
  onAutoTransferToggle,
  onManualTransfer,
}: Props) {
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const [payDay, setPayDay] = useState<number | null>(null);

  useEffect(() => {
    if (!currentStore) return;
    getPayDay(currentStore.storeId)
      .then(setPayDay)
      .catch(() => {});
  }, [currentStore]);

  // D-Day 계산
  const effectivePayDay = payDay ?? 15;
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonthPayDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    effectivePayDay
  );
  const nextMonthPayDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    effectivePayDay
  );
  const isPastPayDay = todayDate.getTime() > thisMonthPayDate.getTime();

  let dDayLabel: string;
  if (isPastPayDay && !isPaid) {
    const overDays = Math.ceil(
      (todayDate.getTime() - thisMonthPayDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    dDayLabel = `D+${overDays}`;
  } else {
    const payDate = isPastPayDay ? nextMonthPayDate : thisMonthPayDate;
    const dDay = Math.ceil(
      (payDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    dDayLabel = dDay === 0 ? 'D-Day' : `D-${dDay}`;
  }

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
            {dDayLabel}
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

      {/* 일괄 승인 토글 */}
      <div className="flex items-center justify-between py-[var(--space-1)]">
        <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
          급여명세서 일괄 승인
        </span>
        <button
          onClick={onApproveToggle}
          className={`relative shrink-0 w-[44px] h-[24px] rounded-full transition-colors cursor-pointer ${
            isAllApproved
              ? 'bg-[var(--color-primary)]'
              : 'bg-[var(--color-status-grey-bg)]'
          }`}
        >
          <span
            className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow transition-transform ${
              isAllApproved ? 'translate-x-[20px]' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 예약 이체 토글 */}
      <div className="flex items-center justify-between py-[var(--space-1)]">
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
    </div>
  );
}
