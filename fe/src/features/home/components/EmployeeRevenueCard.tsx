import { useEffect, useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import imgCharacter from '@/assets/images/3d_V.png';
import useStoreStore from '@/stores/useStoreStore';
import { fetchMyPayroll, getPayDay } from '@/api/payroll';
import type { MyPayrollData } from '@/features/payroll/types';

export default function EmployeeRevenueCard() {
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const [payroll, setPayroll] = useState<MyPayrollData | null>(null);
  const [payDay, setPayDay] = useState<number | null>(null);

  useEffect(() => {
    if (!currentStore) return;
    fetchMyPayroll(currentStore.storeId)
      .then(setPayroll)
      .catch(() => {});
    getPayDay(currentStore.storeId)
      .then(setPayDay)
      .catch(() => {});
  }, [currentStore]);

  const targetMonth = payroll
    ? (() => {
        const [year, month] = payroll.targetMonth.split('-');
        return `${String(year).slice(2)}년 ${String(Number(month))}월 예상 급여`;
      })()
    : '';

  const totalAmount = payroll ? payroll.netPay.toLocaleString() : '-';

  // D-Day 계산
  // - 시간 제거 후 날짜만 비교 (당일 오후에 D-Day가 넘어가는 버그 방지)
  // - 급여일 지났더라도 미지급이면 D-Day 유지
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

  const isTransferred = payroll?.isTransferred ?? false;
  const isPastPayDay = todayDate.getTime() > thisMonthPayDate.getTime();

  let dDayLabel: string;
  if (isPastPayDay && !isTransferred) {
    const overDays = Math.ceil(
      (todayDate.getTime() - thisMonthPayDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    dDayLabel = `월급날 D+${overDays}`;
  } else {
    const payDate = isPastPayDay ? nextMonthPayDate : thisMonthPayDate;
    const dDay = Math.ceil(
      (payDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    dDayLabel = dDay === 0 ? 'D-Day' : `월급날까지 D-${dDay}`;
  }

  return (
    <div className="relative w-full h-[190px] rounded-[var(--radius-lg)] bg-[var(--color-bg-dark)] shadow-[var(--shadow-card)]">
      {/* 콘텐츠 영역만 overflow-hidden - 캐릭터는 카드 밖으로 튀어나옴 */}
      <div className="flex flex-col px-[var(--space-3)] h-full overflow-hidden rounded-[inherit]">
        {/* 섹션 1: 날짜 + 금액 (클릭 시 급여 탭 이동) */}
        <div
          className="flex flex-col gap-[var(--space-1)] cursor-pointer"
          onClick={() => navigate(ROUTES.PAYROLL)}
        >
          <p className="text-[color:var(--color-text-placeholder)] text-base font-medium">
            {targetMonth}
          </p>
          <div className="flex items-baseline gap-[var(--space-1-5)] text-white text-[length:var(--text-3xl)] font-bold">
            <span>{totalAmount}</span>
            <span>원</span>
          </div>
        </div>

        {/* 섹션 2: D-Day 배지 */}
        <div className="flex-1 flex items-start mt-[var(--space-2)]">
          <div
            className="flex items-center gap-[var(--space-3)] py-[var(--space-1)] px-[var(--space-4)] rounded-[var(--radius-xs)] bg-[var(--color-primary)] cursor-pointer"
            onClick={() => navigate(ROUTES.PAYROLL)}
          >
            <Calendar
              size={16}
              color="var(--color-text-black)"
              strokeWidth={2.0}
            />
            <span className="text-[length:var(--text-md)] text-[color:var(--color-text-black)] font-bold whitespace-nowrap">
              {dDayLabel}
            </span>
          </div>
        </div>

        {/* 섹션 3: 급여 페이지 바로가기 */}
        <div className="flex-1 flex items-center">
          <div
            className="flex items-center gap-[var(--space-1-5)] px-[var(--space-1)] pb-[var(--space-5)] cursor-pointer"
            onClick={() => navigate(ROUTES.PAYROLL)}
          >
            <span className="text-[length:var(--text-md)] text-white font-bold whitespace-nowrap">
              급여 상세 보기
            </span>
            <ChevronRight size={20} color="white" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* 캐릭터 이미지 */}
      <img
        alt="알맹이 캐릭터"
        src={imgCharacter}
        className="absolute right-[-30px] bottom-[-50px] h-[220px] w-auto object-contain pointer-events-none"
      />
    </div>
  );
}
