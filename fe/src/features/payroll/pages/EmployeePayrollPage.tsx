import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { FileText } from 'lucide-react';
import stampPaid from '@/assets/images/stamp-paid.png';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import MonthNavigator from '../components/MonthNavigator';
import useAuthStore from '@/stores/useAuthStore';
import { useMyPayroll } from '../hooks/usePayrollQueries';
import { ROUTES } from '@/constants/routes';
import { getPayDay } from '@/api/payroll';
import useStoreStore from '@/stores/useStoreStore';

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

function formatWorkTime(minutes: number): { hours: number; mins: number } {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return { hours, mins };
}

function PageShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
        <DetailHeader title="급여" onBack={() => navigate(ROUTES.HOME)} />
        <main className="flex-1 w-full px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--pb-content)] flex flex-col gap-[var(--space-5)]">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}

export default function EmployeePayrollPage() {
  const navigate = useNavigate();
  const { activeStoreId } = useAuthStore();
  const currentStore = useStoreStore((s) => s.currentStore);
  const [payDayFromApi, setPayDayFromApi] = useState<number | null>(null);

  useEffect(() => {
    if (!currentStore) return;
    getPayDay(currentStore.storeId)
      .then(setPayDayFromApi)
      .catch(() => {});
  }, [currentStore]);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const handlePrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const handleNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const targetMonth = `${year}-${String(month).padStart(2, '0')}`;

  // API 연동 전: payrollId 없으면 mockMyPayroll 폴백
  // API 연동 후: payroll = apiPayroll 으로 변경
  const {
    data: apiPayroll,
    isLoading,
    error,
  } = useMyPayroll(activeStoreId, targetMonth);
  const payroll = apiPayroll ?? null;

  const groupedDetails = useMemo(() => {
    const details = payroll?.details;
    if (!details) return { base: [], allowance: [], deduction: [] };
    return {
      base: details.filter((d) => d.detailType === 'BASE'),
      allowance: details.filter((d) => d.detailType === 'ALLOWANCE'),
      deduction: details.filter((d) => d.detailType === 'DEDUCTION'),
    };
  }, [payroll]);

  const subtotals = useMemo(
    () => ({
      baseSum: groupedDetails.base.reduce((s, d) => s + d.amount, 0),
      allowanceSum: groupedDetails.allowance.reduce((s, d) => s + d.amount, 0),
      deductionSum: groupedDetails.deduction.reduce((s, d) => s + d.amount, 0),
    }),
    [groupedDetails]
  );

  if (isLoading) {
    return (
      <PageShell>
        <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--space-5)]">
          <div className="h-6 w-24 bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] animate-pulse mb-[var(--space-5)]" />
          <div className="h-8 w-40 bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] animate-pulse mb-[var(--space-3)]" />
          <div className="h-4 w-32 bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] animate-pulse" />
        </div>
        <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-form-card)] border border-[var(--color-border-light)] p-[var(--space-5)] flex flex-col gap-[var(--space-4)]">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] animate-pulse"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--space-5)] text-center py-[var(--space-9)]">
          <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
            급여 정보를 불러올 수 없습니다.
          </p>
        </div>
      </PageShell>
    );
  }

  if (!payroll?.payrollId) {
    return (
      <PageShell>
        <div className="w-full bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
          <MonthNavigator
            year={year}
            month={month}
            onPrev={handlePrev}
            onNext={handleNext}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] py-[var(--space-9)]">
          <div
            className="rounded-full mb-[var(--space-5)] flex items-center justify-center"
            style={{
              width: 'var(--size-empty-outer)',
              height: 'var(--size-empty-outer)',
              background: 'var(--color-empty-icon-outer)',
            }}
          >
            <FileText size={32} color="var(--color-primary)" strokeWidth={2} />
          </div>
          <p className="text-[length:var(--text-base)] font-bold text-[color:var(--color-text-primary)] mb-[var(--space-2)]">
            이번 달 급여 정보가 없어요
          </p>
          <p className="text-[length:var(--text-xs)] text-[color:var(--color-empty-text-sub)]">
            급여가 생성되면 여기서 확인할 수 있어요
          </p>
        </div>
      </PageShell>
    );
  }

  const { hours: totalHours, mins: totalMins } = formatWorkTime(
    payroll.totalWorkMinutes
  );
  const { hours: nightHours, mins: nightMins } = formatWorkTime(
    payroll.nightWorkMinutes
  );
  const { hours: overtimeHours, mins: overtimeMins } = formatWorkTime(
    payroll.overtimeMinutes
  );

  // 지급 완료: BE isTransferred 기반, 날짜는 D-Day 표시용
  const isPaid = payroll.isTransferred;
  const effectivePayDay = payDayFromApi ?? 15;
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const thisMonthPayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    effectivePayDay
  );
  const nextMonthPayDate = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
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
  const payDateLabel = `${month === 12 ? 1 : month + 1}월 ${effectivePayDay}일`;

  return (
    <PageShell>
      {/* Card 1: 월 선택 + 급여 요약 */}
      <div className="w-full bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex items-center justify-between pr-[var(--space-5)]">
          <MonthNavigator
            year={year}
            month={month}
            onPrev={handlePrev}
            onNext={handleNext}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
          <span className="text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-sub)] whitespace-nowrap">
            {isPaid
              ? `${payroll.transferredAt ? dayjs(payroll.transferredAt).format('M월 D일') : payDateLabel} 지급 완료`
              : `${payDateLabel} 지급 예정`}
          </span>
        </div>

        <div className="border-t border-[var(--color-border-light)]" />

        <div className="px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-6)] flex flex-col gap-[var(--space-5)]">
          <div className="flex items-start justify-between gap-[var(--space-3)]">
            <div className="flex flex-col gap-[var(--space-1)]">
              <span className="text-[length:var(--text-xl)] font-semibold text-[color:var(--color-text-sub)] tracking-[var(--tracking-tight)]">
                {isPaid ? '실수령액' : '예상 수령액'}
              </span>
              <span className="text-[length:var(--text-3xl)] font-bold text-[color:var(--color-text-primary)] tracking-[var(--tracking-tighter)]">
                {formatAmount(payroll.netPay)}
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

          <div className="flex flex-col gap-[var(--space-2)]">
            <div className="flex items-center justify-between">
              <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-sub)]">
                총 근무
              </span>
              <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
                {totalHours}시간 {totalMins > 0 ? `${totalMins}분` : ''}
              </span>
            </div>
            {payroll.nightWorkMinutes > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-sub)]">
                  야간 근무
                </span>
                <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
                  {nightHours}시간 {nightMins > 0 ? `${nightMins}분` : ''}
                </span>
              </div>
            )}
            {payroll.overtimeMinutes > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-sub)]">
                  연장 근무
                </span>
                <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
                  {overtimeHours}시간{' '}
                  {overtimeMins > 0 ? `${overtimeMins}분` : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-[var(--space-3)]">
            <button
              onClick={() => navigate(ROUTES.REPORT)}
              className="flex-1 py-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)] cursor-pointer"
            >
              분석 리포트
            </button>
            <button
              onClick={() => {
                if (!apiPayroll?.payrollId) return;
                navigate(
                  ROUTES.WORKER_DOCUMENTS_PAYSLIP_DETAIL.replace(
                    ':payslipId',
                    String(apiPayroll.payrollId)
                  ),
                  {
                    state: {
                      targetMonth,
                      from: 'payroll',
                    },
                  }
                );
              }}
              className="flex-1 py-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-badge-green-bg)] text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)] cursor-pointer"
            >
              급여 명세서
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: 급여 내역 (기본급 / 수당 / 공제) */}
      <div className="w-full bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] py-[var(--space-5)]">
        {groupedDetails.base.length > 0 && (
          <div className="pb-[var(--space-5)]">
            <div className="flex items-center justify-between mb-[var(--space-4)] bg-[var(--color-badge-green-bg)] rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-1-5)]">
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-status-badge-green-text)]">
                기본급
              </span>
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-status-badge-green-text)]">
                {formatAmount(subtotals.baseSum)}
              </span>
            </div>
            <div className="flex flex-col gap-[var(--space-4)]">
              {groupedDetails.base.map((item) => (
                <div key={item.detailId}>
                  <div className="flex items-center justify-between mb-[var(--space-1)]">
                    <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-sub)]">
                      {item.itemName}
                    </span>
                    <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--color-text-primary)]">
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                  {item.calculationFormula && (
                    <p className="text-[length:var(--text-2xs)] text-[color:var(--color-text-light)]">
                      {item.calculationFormula}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedDetails.base.length > 0 &&
          (groupedDetails.allowance.length > 0 ||
            groupedDetails.deduction.length > 0) && (
            <div className="border-t border-[var(--color-border-light)] mb-[var(--space-5)]" />
          )}

        {groupedDetails.allowance.length > 0 && (
          <div className="pb-[var(--space-5)]">
            <div className="flex items-center justify-between mb-[var(--space-4)] bg-[var(--color-badge-orange-bg)] rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-1-5)]">
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-badge-orange-text)]">
                수당
              </span>
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-badge-orange-text)]">
                {formatAmount(subtotals.allowanceSum)}
              </span>
            </div>
            <div className="flex flex-col gap-[var(--space-4)]">
              {groupedDetails.allowance.map((item) => (
                <div key={item.detailId}>
                  <div className="flex items-center justify-between mb-[var(--space-1)]">
                    <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-sub)]">
                      {item.itemName}
                    </span>
                    <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--color-text-primary)]">
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                  {item.calculationFormula && (
                    <p className="text-[length:var(--text-2xs)] text-[color:var(--color-text-light)]">
                      {item.calculationFormula}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(groupedDetails.base.length > 0 ||
          groupedDetails.allowance.length > 0) &&
          groupedDetails.deduction.length > 0 && (
            <div className="border-t border-[var(--color-border-light)] mb-[var(--space-5)]" />
          )}

        {groupedDetails.deduction.length > 0 && (
          <div className="pb-[var(--space-5)]">
            <div className="flex items-center justify-between mb-[var(--space-4)] bg-[var(--color-status-grey-bg)] rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-1-5)]">
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-status-grey-dot)]">
                공제
              </span>
              <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-status-grey-dot)]">
                -{formatAmount(subtotals.deductionSum)}
              </span>
            </div>
            <div className="flex flex-col gap-[var(--space-4)]">
              {groupedDetails.deduction.map((item) => (
                <div key={item.detailId}>
                  <div className="flex items-center justify-between mb-[var(--space-1)]">
                    <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-sub)]">
                      {item.itemName}
                    </span>
                    <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--color-text-muted)]">
                      -{formatAmount(item.amount)}
                    </span>
                  </div>
                  {item.calculationFormula && (
                    <p className="text-[length:var(--text-2xs)] text-[color:var(--color-text-light)]">
                      {item.calculationFormula}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[var(--color-border-light)] pt-[var(--space-5)]">
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-md2)] font-bold text-[color:var(--color-text-primary)]">
              실수령액
            </span>
            <span className="text-[length:var(--text-xl)] font-bold text-[color:var(--color-text-primary)]">
              {formatAmount(payroll.netPay)}
            </span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
