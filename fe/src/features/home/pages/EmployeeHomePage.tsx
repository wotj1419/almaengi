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
import AlertBanner from '../components/AlertBanner';
import useStoreStore from '@/stores/useStoreStore';
import { getMyEmployeeStores } from '@/api/store';
import { useChatStore } from '@/stores/useChatStore';

export default function EmployeeHomePage() {
  const navigate = useNavigate();
  const authLogout = useAuthStore((state) => state.logout);
  const setStores = useStoreStore((s) => s.setStores);
  const currentStore = useStoreStore((s) => s.currentStore);
  const fetchRooms = useChatStore((s) => s.fetchRooms);

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem('accessToken'));
    if (!hasToken) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    getMyEmployeeStores()
      .then((stores) => {
        setStores(stores);
        if (stores.length === 0) {
          const isPending = localStorage.getItem('pendingJoin') === 'true';
          navigate(isPending ? ROUTES.STORE_JOIN_PENDING : ROUTES.STORE_JOIN, {
            replace: true,
          });
        }
      })
      .catch(() => {});
  }, [setStores, navigate]);

  useEffect(() => {
    if (currentStore) fetchRooms(currentStore.storeId);
  }, [currentStore, fetchRooms]);

  // 브라우저 뒤로가기 시 로그인 페이지로 이동 (회원가입 페이지로 돌아가는 것 방지)
  useEffect(() => {
    const handlePopState = () => {
      navigate(ROUTES.LOGIN, { replace: true });
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      authLogout();
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      toast.error('로그아웃에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      <div className="bg-[var(--color-bg-base)] min-h-screen">
        <div className="flex flex-col items-center w-full max-w-[var(--max-w-app)] mx-auto relative [overflow-x:clip]">
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
            <AlertBanner />
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
