import { useEffect, useState } from 'react';
import { Calendar, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import imgCharacter from '@/assets/images/character.png';
import useStoreStore from '@/stores/useStoreStore';
import {
  getPayrollSummary,
  getPayDay,
  type PayrollSummary,
} from '@/api/payroll';

export default function RevenueCard() {
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [payDay, setPayDay] = useState<number | null>(null);
  const [showDDay, setShowDDay] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    getPayrollSummary(currentStore.storeId)
      .then(setSummary)
      .catch(() => {});
    getPayDay(currentStore.storeId)
      .then(setPayDay)
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
  const today = new Date();
  const effectivePayDay = payDay ?? 25;
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
  const payDate =
    today <= thisMonthPayDate ? thisMonthPayDate : nextMonthPayDate;
  const dDay = Math.ceil(
    (payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dDayLabel = dDay === 0 ? '오늘 월급날!' : `월급날까지 D-${dDay}`;

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
      <div
        className="absolute h-[130px] top-[65px] w-[130px] origin-top-right scale-90"
        style={{ right: 'var(--space-3)' }}
      >
        <div className="absolute contents left-[-50.5px] top-[-26px]">
          <div className="absolute flex h-[56px] items-center justify-center left-[-50.5px] top-[138px] w-[153.5px]">
            <div className="-scale-y-100 flex-none rotate-180">
              <div className="h-[56px] relative w-[153.5px]">
                <div className="absolute inset-[-5.36%_-3.09%_-5.56%_-2.2%]">
                  <svg
                    className="block size-full"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 161.619 62.1118"
                  >
                    <path
                      d="M132.818 1.5L133.229 2.33984L158.229 53.3398L159.251 55.4238L156.931 55.499L3.43145 60.499L1.69122 60.5557L1.89239 58.8262L8.41387 2.82617L8.56817 1.5H132.818Z"
                      fill="white"
                      stroke="black"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute flex h-[216.989px] items-center justify-center left-[-42.87px] top-[-26px] w-[192.879px]">
            <div className="-scale-y-100 flex-none rotate-180">
              <div className="h-[216.989px] relative w-[192.879px]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <img
                    alt="알맹이 캐릭터"
                    className="absolute h-[289.42%] left-[-12.66%] max-w-none top-0 w-[330.68%]"
                    src={imgCharacter}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
