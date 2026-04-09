import { CircleAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  type: 'manual' | 'auto';
  employeeCount: number;
  totalNetPay: number;
  payDay: number | null;
  onConfirm: () => void;
  onClose: () => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export default function TransferAgreementModal({
  isOpen,
  type,
  employeeCount,
  totalNetPay,
  payDay,
  onConfirm,
  onClose,
}: Props) {
  if (!isOpen) return null;

  const isAuto = type === 'auto';

  // 이체 날짜 (하드코딩: 급여일 21일)
  const PAY_DAY = payDay ?? 21;
  const today = new Date();
  const transferDateLabel = isAuto
    ? `매월 ${PAY_DAY}일`
    : `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] w-[85%] max-w-[510px] overflow-hidden">
        {/* 헤더 */}
        <div className="flex flex-col items-center gap-[var(--space-2)] pt-[var(--space-7)] px-[var(--space-6)]">
          <CircleAlert
            size={32}
            color="var(--color-badge-orange-text)"
            strokeWidth={2}
          />
          <span className="text-[length:var(--text-lg)] font-bold text-[color:var(--color-text-primary)]">
            {isAuto ? '예약 이체 활성화' : '급여 이체 확인'}
          </span>
        </div>

        {/* 이체 요약 */}
        <div
          className={`mx-[var(--space-6)] mt-[var(--space-5)] p-[var(--space-4)] bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] ${isAuto ? 'flex items-center justify-center' : ''}`}
        >
          <div
            className={`flex items-center justify-between w-full ${!isAuto ? 'mb-[var(--space-2)]' : ''}`}
          >
            <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-sub)]">
              이체 날짜
            </span>
            <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
              {transferDateLabel}
            </span>
          </div>
          {!isAuto && (
            <>
              <div className="flex items-center justify-between mb-[var(--space-2)]">
                <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-sub)]">
                  이체 대상
                </span>
                <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
                  {employeeCount}명
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-sub)]">
                  총 이체 금액
                </span>
                <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
                  {formatAmount(totalNetPay)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* 동의 사항 */}
        <div className="mx-[var(--space-6)] mt-[var(--space-4)] flex flex-col gap-[var(--space-2)]">
          <p className="text-[length:var(--text-2xs)] font-bold text-[color:var(--color-text-sub)]">
            아래 사항에 동의합니다
          </p>
          <ul className="flex flex-col gap-[var(--space-1-5)] text-[length:var(--text-2xs)] text-[color:var(--color-text-muted)] leading-relaxed">
            <li className="flex gap-[var(--space-1)]">
              <span className="shrink-0">•</span>
              <span>각 직원의 급여명세서에 기재된 금액대로 이체됩니다.</span>
            </li>
            <li className="flex gap-[var(--space-1)]">
              <span className="shrink-0">•</span>
              <span>
                잔액 부족 또는 급여명세서 미승인 시 이체가 실패할 수 있습니다.
              </span>
            </li>
            <li className="flex gap-[var(--space-1)]">
              <span className="shrink-0">•</span>
              <span>이체 후 취소가 불가합니다.</span>
            </li>
            {isAuto ? (
              <>
                <li className="flex gap-[var(--space-1)]">
                  <span className="shrink-0">•</span>
                  <span>매월 급여일에 자동으로 이체가 진행됩니다.</span>
                </li>
                <li className="flex gap-[var(--space-1)]">
                  <span className="shrink-0">•</span>
                  <span>예약 이체는 언제든지 해제할 수 있습니다.</span>
                </li>
                <li className="flex gap-[var(--space-1)]">
                  <span className="shrink-0">•</span>
                  <span>처리 결과는 알림으로 안내됩니다.</span>
                </li>
              </>
            ) : (
              <li className="flex gap-[var(--space-1)]">
                <span className="shrink-0">•</span>
                <span>이체는 요청 즉시 처리됩니다.</span>
              </li>
            )}
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex gap-[var(--space-2)] px-[var(--space-6)] pt-[var(--space-5)] pb-[var(--space-6)]">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center h-[44px] bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] text-[length:var(--text-md)] font-bold text-[color:var(--color-text-muted)] cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center h-[44px] bg-[var(--color-primary)] rounded-[var(--radius-sm)] text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)] cursor-pointer"
          >
            {isAuto ? '활성화' : '이체하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
