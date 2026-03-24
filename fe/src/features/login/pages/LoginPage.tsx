import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { login } from '@/api/auth';
import { validateSessionByReissue } from '@/api/session';
import { getMyStoresWithToken } from '@/api/store';
import useAuthStore from '@/stores/useAuthStore';
import ConfirmModal from '@/components/common/ConfirmModal';

const INPUT_CLASS =
  'h-14 px-4 bg-[var(--color-bg-white)] rounded-[var(--radius-xl)] border border-[var(--color-border-muted)] text-[length:var(--text-base)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none';

interface LabeledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: React.ReactNode;
}

function LabeledInput({
  label,
  suffix,
  className,
  ...inputProps
}: LabeledInputProps) {
  return (
    <div className="flex flex-col">
      <label className="pb-2 text-[length:var(--text-sm)] font-medium text-[var(--color-text-secondary)] leading-5">
        {label}
      </label>
      {suffix ? (
        <div className="relative">
          <input
            className={`w-full pr-12 ${INPUT_CLASS} ${className ?? ''}`}
            {...inputProps}
          />
          {suffix}
        </div>
      ) : (
        <input
          className={`${INPUT_CLASS} ${className ?? ''}`}
          {...inputProps}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // 로그인 실패 시 에러 메시지
  const [showErrorModal, setShowErrorModal] = useState(false); // 에러 팝업 표시 여부

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const authStatus = await validateSessionByReissue();
      if (!isMounted) return;

      if (authStatus === 'authenticated') {
        navigate(ROUTES.HOME, { replace: true });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // 로그인 폼 제출 핸들러
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      // 응답 status로 성공/실패 구분 (백엔드는 실패 시에도 HTTP 200 반환)
      if (res.status !== 'SUCCESS') {
        setErrorMessage(res.message || '로그인에 실패했습니다.');
        setShowErrorModal(true);
        return;
      }

      let activeStoreId: number | null = null;
      try {
        const stores = await getMyStoresWithToken(res.data.accessToken);
        if (stores.length === 1) {
          activeStoreId = stores[0].storeId;
        } else if (stores.length > 1) {
          activeStoreId = Math.min(...stores.map((store) => store.storeId));
        }
      } catch {
        activeStoreId = null;
      }

      // Zustand 스토어에 유저 정보 & 토큰 저장
      authLogin(
        { id: res.data.userId, name: res.data.name, role: res.data.role },
        res.data.accessToken,
        activeStoreId
      );

      // FCM 토큰 동기화는 App 루트의 useFcmBootstrap()에서 단일 책임으로 수행합니다.
      // WHY: LoginPage에서도 중복으로 getToken을 호출하면 Chrome Push 서비스에서
      // TOO_MANY_REGISTRATIONS / AbortError가 발생할 수 있어, 실행 경로를 하나로 통일합니다.

      // 로그인 성공 시 홈으로 이동 (replace: 뒤로가기로 로그인 페이지 재진입 방지)
      navigate(ROUTES.HOME, { replace: true });
    } catch {
      // 네트워크 오류 등 예외 발생 시
      setErrorMessage('서버에 연결할 수 없습니다.');
      setShowErrorModal(true);
    }
  };

  return (
    <div className="min-h-dvh px-[var(--space-6)] py-14 bg-[var(--color-bg-base)] flex justify-center items-center">
      <div className="w-full max-w-96 bg-[var(--color-bg-white)] rounded-[var(--radius-xl)] shadow-xl border border-[var(--color-border-light)] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="grid grid-cols-[20px_1fr_20px] items-center p-3.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-5 w-5 items-center justify-center cursor-pointer"
          >
            <ChevronLeft
              size={20}
              color="var(--color-text-primary)"
              strokeWidth={2}
            />
          </button>
          <span className="text-center text-[length:var(--text-xl)] font-bold text-black leading-6">
            알맹이
          </span>
          <div aria-hidden="true" className="h-5 w-5" />
        </div>

        {/* 환영 메시지 */}
        <div className="px-6 pt-8 pb-4 flex flex-col gap-2">
          <h1 className="text-[length:var(--text-3xl)] font-bold text-[var(--color-text-primary)] leading-10">
            환영합니다!
          </h1>
          <p className="text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)] leading-6">
            알맹이에 로그인하여 시작하세요.
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleLogin} className="px-6 py-4 flex flex-col gap-4">
          <LabeledInput
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
          />

          <LabeledInput
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff size={20} color="var(--color-text-placeholder)" />
                ) : (
                  <Eye size={20} color="var(--color-text-placeholder)" />
                )}
              </button>
            }
          />

          <button
            type="submit"
            className="mt-2 w-full h-14 bg-[var(--color-primary)] rounded-3xl text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)] leading-7 cursor-pointer"
          >
            로그인
          </button>
        </form>

        {/* 회원가입 안내 */}
        <div className="px-6 pt-4 pb-10 flex justify-center gap-1">
          <span className="text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)] leading-5">
            계정이 없으신가요?
          </span>
          <Link
            to={ROUTES.SIGNUP}
            className="text-[length:var(--text-base)] font-medium text-[var(--color-primary)] leading-5"
          >
            회원가입
          </Link>
        </div>

        {/* 하단 컬러 바 */}
        <div className="h-2 bg-[var(--color-primary)]" />
      </div>

      {/* 로그인 실패 에러 팝업 - X 버튼으로 닫기, 입력값 유지 */}
      <ConfirmModal
        isOpen={showErrorModal}
        title="로그인 실패"
        description={errorMessage}
        showCloseButton
        confirmText=""
        cancelText=""
        onConfirm={() => setShowErrorModal(false)}
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
}
