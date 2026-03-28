import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/common/DetailHeader';
import { joinStore, getMyEmployeeStores } from '@/api/store';
import { getApiErrorMessage } from '@/api/error';
import { logout } from '@/api/auth';
import useStoreStore from '@/stores/useStoreStore';
import useAuthStore from '@/stores/useAuthStore';

export default function StoreJoinPage() {
  const navigate = useNavigate();
  const setStores = useStoreStore((s) => s.setStores);
  const setActiveStoreId = useAuthStore((s) => s.setActiveStoreId);
  const authLogout = useAuthStore((s) => s.logout);

  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCodeFilled = inviteCode.trim().length > 0;

  // 합류 성공/이미 소속 시 공통 컨텍스트 동기화
  const syncStoreContext = async () => {
    const stores = await getMyEmployeeStores();
    setStores(stores);

    if (stores.length > 0) {
      const nextActiveId =
        stores.length === 1
          ? stores[0].storeId
          : Math.min(...stores.map((s) => s.storeId));
      setActiveStoreId(nextActiveId);
    }

    return stores;
  };

  // 뒤로가기 시 로그아웃 후 로그인 페이지로 이동
  const handleBackToLogin = useCallback(async () => {
    try {
      await logout();
    } catch {
      // no-op
    } finally {
      authLogout();
      setStores([]);
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [authLogout, setStores, navigate]);

  const handleJoin = async () => {
    if (!isCodeFilled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await joinStore(inviteCode.trim());

      // 백엔드 joinStore는 신규 합류 시 WAITING 상태로 생성
      if (result.status === 'WAITING' || result.status === 'INVITED') {
        localStorage.setItem('pendingJoin', 'true');
        toast.success(
          '매장 합류 요청이 완료되었어요. 사장님 승인까지 기다려주세요.'
        );
        navigate(ROUTES.STORE_JOIN_PENDING, { replace: true });
        return;
      }

      // WORKING 등 즉시 활성 상태
      localStorage.removeItem('pendingJoin');
      await syncStoreContext();
      toast.success('매장에 합류했어요.');
      navigate(ROUTES.HOME, { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // ApiResponse.error.status는 에러 "코드" 문자열 (예: S003)
        const errorStatus = error.response?.data?.status as string | undefined;

        if (
          errorStatus === 'S003' ||
          errorStatus === 'ALREADY_STORE_EMPLOYEE'
        ) {
          const stores = await syncStoreContext();

          if (stores.length > 0) {
            localStorage.removeItem('pendingJoin');
            toast.success('이미 소속된 매장으로 이동합니다.');
            navigate(ROUTES.HOME, { replace: true });
            return;
          }

          // 아직 승인 전이면 내 매장 목록이 비어 있으므로 pending으로 이동
          localStorage.setItem('pendingJoin', 'true');
          toast.success(
            '이미 합류 요청 대기중입니다. 승인 상태 페이지로 이동합니다.'
          );
          navigate(ROUTES.STORE_JOIN_PENDING, { replace: true });
          return;
        }
      }

      toast.error(
        getApiErrorMessage(error, '초대 코드 확인 중 오류가 발생했어요.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 브라우저/시스템 뒤로가기(popstate) 시 로그아웃 후 로그인으로 이동
  useEffect(() => {
    const handlePopState = () => {
      void handleBackToLogin();
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleBackToLogin]);

  return (
    <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
      <div className="w-full md:max-w-[600px] min-h-screen flex flex-col bg-[var(--color-bg-base)]">
        <DetailHeader
          title="매장 합류"
          onBack={() => void handleBackToLogin()}
        />

        <main className="flex-1 px-[var(--space-5)] pt-[var(--space-7)]">
          <div className="flex flex-col gap-[var(--space-8)]">
            <div className="flex flex-col gap-[var(--space-2)]">
              <h2 className="text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)]">
                초대 코드를 입력해주세요
              </h2>
              <p className="text-[length:var(--text-sm)] text-[var(--color-text-placeholder)]">
                사장님께 받은 초대 코드를 입력하면 매장에 합류할 수 있어요.
              </p>
            </div>

            <div className="flex flex-col gap-[var(--space-2)]">
              <label className="px-[var(--space-1)] text-[length:var(--text-md)] font-bold text-[var(--color-text-secondary)]">
                초대 코드
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleJoin();
                }}
                placeholder="초대 코드를 입력하세요"
                maxLength={20}
                className="w-full h-14 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none focus:border-[var(--color-primary)] tracking-widest"
              />
            </div>
          </div>
        </main>

        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-[600px] bg-[var(--color-bg-base)] px-[var(--space-5)] pt-[var(--space-4)]"
          style={{
            paddingBottom:
              'calc(var(--space-7) + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button
            type="button"
            onClick={() => {
              void handleJoin();
            }}
            disabled={!isCodeFilled || isSubmitting}
            className={`w-full h-14 rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] text-[length:var(--text-md2)] font-bold transition-colors ${
              isCodeFilled && !isSubmitting
                ? 'bg-[var(--color-primary)] text-[var(--color-text-primary)] cursor-pointer'
                : 'bg-[var(--color-bg-surface)] text-[var(--color-text-placeholder)] cursor-not-allowed'
            }`}
          >
            {isSubmitting ? '합류 중...' : '합류하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
