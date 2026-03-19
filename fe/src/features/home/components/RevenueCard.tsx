import { ChevronRight, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import imgCharacter from '@/assets/images/character.png';

export default function RevenueCard() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-[190px] rounded-[var(--radius-lg)] bg-[var(--color-bg-dark)] shadow-[var(--shadow-card)]">
      {/* 콘텐츠 영역만 overflow-hidden - 캐릭터는 카드 밖으로 튀어나옴 */}
      <div className="flex flex-col px-2.5 h-full overflow-hidden rounded-[inherit]">
        {/* 섹션 1: 날짜 + 금액 */}
        {/* 백엔드 연동 시 교체:
            날짜: dayjs(backendDate).format('YY년 M월')
            금액: amount.toLocaleString() */}
        <div className="flex flex-col gap-1">
          <p className="text-[color:var(--color-text-placeholder)] text-base font-medium">
            {/* {dayjs(backendDate).format('YY년 M월')} 알바 급여 */}
            26년 3월 알바 급여
          </p>
          <div className="flex items-baseline gap-1.5 text-white text-[length:var(--text-3xl)] font-bold">
            {/* <span>{amount.toLocaleString()}</span> */}
            <span>12,450,000</span>
            <span>원</span>
          </div>
        </div>

        {/* 섹션 2: 지난달 대비 배지 */}
        <div className="flex-1 flex items-start mt-2">
          <div className="flex items-center gap-2.5 py-1 px-3 rounded-[7.3px] bg-[var(--color-primary)]">
            <TrendingDown size={16} color="black" strokeWidth={2.0} />
            {/* <TrendingUp size={16} color="black" strokeWidth={2.0} /> */}
            <span className="text-[length:var(--text-md)] text-black font-bold whitespace-nowrap">
              지난달 대비 5%
            </span>
          </div>
        </div>

        {/* 섹션 3: 리포트 보러가기 */}
        <div className="flex-1 flex items-center">
          <div
            className="flex items-center gap-1.5 px-[5px] pb-5 cursor-pointer"
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
        style={{ right: '10px' }}
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
