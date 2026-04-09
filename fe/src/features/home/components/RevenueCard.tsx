import { useEffect, useState } from 'react';
import { Calendar, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import imgCharacter from '@/assets/images/3d_V.png';
import useStoreStore from '@/stores/useStoreStore';
import {
  getPayrollSummary,
  getPayDay,
  fetchStorePayrolls,
  type PayrollSummary,
} from '@/api/payroll';

export default function RevenueCard() {
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [payDay, setPayDay] = useState<number | null>(null);
  const [isAllTransferred, setIsAllTransferred] = useState(false);
  const [showDDay, setShowDDay] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    getPayrollSummary(currentStore.storeId)
      .then(setSummary)
      .catch(() => {});
    getPayDay(currentStore.storeId)
      .then(setPayDay)
      .catch(() => {});
    // 지급 여부 확인 (전 직원 지급 완료 시 D-Day 초기화)
    const now = new Date();
    const targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    fetchStorePayrolls(currentStore.storeId, targetMonth)
      .then((data) => {
        const employees = data.employees ?? [];
        setIsAllTransferred(
          employees.length > 0 && employees.every((e) => e.isTransferred)
        );
      })
      .catch(() => {});
  }, [currentStore]);

  // 3초마다 D-Day ↔ 전월대비 전환
  useEffect(() => {
    const timer = setInterval(() => setShowDDay((prev) => !prev), 5000);
    return () => clearInterval(timer);
  }, []);

  const targetMonth = summary
    ? (() => {
        const [year, month] = summary.targetMonth.split('-');
        return `${String(year).slice(2)}년 ${String(Number(month))}월 알바 급여`;
      })()
    : '';

  const totalAmount = summary ? summary.thisMonthTotal.toLocaleString() : '-';

  // D-Day 계산
  // - 시간 제거 후 날짜만 비교 (당일 오후에 D-Day가 넘어가는 버그 방지)
  // - 급여일 지났더라도 전 직원 미지급이면 D-Day 유지
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
  if (isPastPayDay && !isAllTransferred) {
    const overDays = Math.ceil(
      (todayDate.getTime() - thisMonthPayDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    dDayLabel = `급여 지연 D+${overDays}`;
  } else {
    const payDate = isPastPayDay ? nextMonthPayDate : thisMonthPayDate;
    const dDay = Math.ceil(
      (payDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    dDayLabel = dDay === 0 ? '월급날 D-Day' : `월급날까지 D-${dDay}`;
  }

  // 전월 대비
  const isUp = summary?.changeDirection === 'UP';
  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  const changeLabel =
    summary?.changeRate != null
      ? `지난달 대비 ${summary.changeRate}%`
      : '지난달 데이터 없음';

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

        {/* 섹션 2: 슬라이드 배지 (D-Day ↔ 전월대비) */}
        <div className="flex-1 flex items-start mt-[var(--space-2)]">
          <div
            className="relative min-w-[170px] h-[28px] rounded-[var(--radius-xs)] bg-[var(--color-primary)] overflow-hidden cursor-pointer"
            onClick={() => navigate(ROUTES.PAYROLL)}
          >
            <div
              key={showDDay ? 'dday' : 'change'}
              className="absolute inset-0 flex items-center gap-[var(--space-3)] px-[var(--space-4)] animate-slide-down"
            >
              {showDDay ? (
                <Calendar
                  size={16}
                  color="var(--color-text-black)"
                  strokeWidth={2.0}
                />
              ) : (
                <TrendIcon
                  size={16}
                  color="var(--color-text-black)"
                  strokeWidth={2.0}
                />
              )}
              <span className="text-[length:var(--text-md)] text-[color:var(--color-text-black)] font-bold whitespace-nowrap">
                {showDDay ? dDayLabel : changeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* 섹션 3: 리포트 보러가기 */}
        <div className="flex-1 flex items-center">
          <div
            className="flex items-center gap-[var(--space-1-5)] px-[var(--space-1)] pb-[var(--space-5)] cursor-pointer"
            onClick={() => navigate(ROUTES.REPORT)}
          >
            <span className="text-[length:var(--text-md)] text-white font-bold whitespace-nowrap">
              리포트 보러가기
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
