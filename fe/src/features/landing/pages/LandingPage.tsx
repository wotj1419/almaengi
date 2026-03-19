import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import landingImg from '@/assets/images/almangi_main.png';

// 스플래시(랜딩) 페이지 - 앱 진입 시 3초간 표시 후 로그인 페이지로 자동 이동
export default function LandingPage() {
  const navigate = useNavigate();

  // 3초 후 로그인 페이지로 자동 이동 (replace: 뒤로가기 방지)
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(ROUTES.LOGIN, { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-dvh relative bg-stone-50 flex flex-col justify-center items-center overflow-hidden">
      <div className="flex flex-col items-center">
        <span className="text-5xl font-medium text-slate-900 leading-[60px]">
          알맹이
        </span>
        <div className="w-56 h-56 mt-2">
          <img
            className="w-full h-full object-contain"
            src={landingImg}
            alt="알맹이 캐릭터"
          />
        </div>
      </div>

      {/* 장식용 블러 원형 */}
      <div className="w-64 h-64 absolute -left-10 -top-22 bg-lime-300/5 rounded-full blur-[32px]" />
      <div className="w-80 h-80 absolute left-28 bottom-0 bg-lime-300/10 rounded-full blur-[32px]" />
    </div>
  );
}
