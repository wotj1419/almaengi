import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '@/constants/routes';
import { logout } from '@/api/auth';
import useAuthStore from '@/stores/useAuthStore';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import EmployeeRevenueCard from '../components/EmployeeRevenueCard';
import EmployeeWorkStatusCard from '../components/EmployeeWorkStatusCard';
import ActionGrid from '../components/ActionGrid';

export default function EmployeeHomePage() {
  const navigate = useNavigate();
  const authLogout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem('accessToken'));
    if (!hasToken) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [navigate]);

  // 브라우저 뒤로가기 시 로그인 페이지로 이동 (회원가입 페이지로 돌아가는 것 방지)
  useEffect(() => {
    const handlePopState = () => {
      navigate(ROUTES.LOGIN, { replace: true });
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  // ─── 직원 홈 로그아웃 처리 ────────────────────────────────────────────
  // [처리 순서]
  // 1. 서버 API 호출: refreshToken 쿠키 무효화
  // 2. Zustand auth 초기화: accessToken 제거 + user/isLoggedIn 초기화
  // 3. 로그인 페이지로 이동 (replace: true → 뒤로 가기 차단)
  //
  // [에러 처리]
  // - 401: axios 인터셉터가 이미 authLogout() + /login 리다이렉트를 처리
  //        → catch에서 중복 처리 금지, toast만 표시
  // - 5xx/네트워크 오류: 에러 토스트 표시
  const handleLogout = async () => {
    try {
      // 서버 로그아웃 요청 (refreshToken cookie 무효화)
      await logout();
      // Zustand auth 상태 초기화 + accessToken localStorage 제거
      authLogout();
      // 로그인 페이지로 이동 (뒤로 가기 시 보호 페이지 재진입 차단)
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      // 401은 axios 인터셉터가 처리 → 여기서 중복 처리 금지
      // 5xx/네트워크 오류 등 기타 실패만 토스트로 알림
      toast.error('로그아웃에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
        <div className="flex flex-col items-center w-full md:max-w-[600px] relative overflow-x-hidden">
          {/* 배경 레이어 */}
          <div className="absolute left-0 top-0 w-full h-full min-h-[935px] pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[433px] bg-[var(--color-bg-dark)]" />
            <div className="absolute top-[350px] left-0 w-full h-[585px] bg-[var(--color-bg-base)] rounded-tl-[var(--radius-xl)] rounded-tr-[var(--radius-xl)]" />
          </div>

          {/* 헤더 — 직원 홈에서만 로그아웃 아이콘 표시 */}
          <Header
            showLogout
            onLogout={() => {
              void handleLogout();
            }}
          />

          {/* 메인 콘텐츠 */}
          <div className="flex flex-col gap-[var(--space-5)] items-center pt-[var(--space-3)] pb-[var(--space-9)] px-[var(--space-5)] relative w-full">
            <EmployeeRevenueCard />
            <EmployeeWorkStatusCard />
            <ActionGrid />
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 - 화면 고정 */}
      <BottomNav />
    </>
  );
}
