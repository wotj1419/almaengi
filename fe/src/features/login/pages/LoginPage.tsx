import {
  useEffect,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { login } from '@/api/auth';
import { validateSessionByReissue } from '@/api/session';
import {
  getMyStoresWithToken,
  getMyEmployeeStoresWithToken,
} from '@/api/store';
import useAuthStore from '@/stores/useAuthStore';
import {
  validateEmailFormat,
  validatePasswordFormat,
} from '@/utils/validation';

const INPUT_CLASS =
  'h-14 px-4 bg-[var(--color-bg-white)] rounded-[var(--radius-xl)] border border-[var(--color-border-muted)] text-[length:var(--text-base)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none';

const TEST_ACCOUNTS = [
  {
    label: '사장 테스트 로그인',
    email: 'owner@test.com',
    password: 'Test1234!',
  },
  {
    label: '직원 테스트 로그인',
    email: 'employee@test.com',
    password: 'Test1234!',
  },
] as const;

const IS_TEST_LOGIN_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true';

interface LabeledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: ReactNode;
  error?: string;
}

function LabeledInput({
  label,
  suffix,
  error,
  className,
  ...inputProps
}: LabeledInputProps) {
  const borderClass = error
    ? 'border-red-500'
    : 'border-[var(--color-border-muted)]';

  return (
    <div className="flex flex-col">
      <label className="pb-2 text-[length:var(--text-sm)] font-medium text-[var(--color-text-secondary)] leading-5">
        {label}
      </label>
      {suffix ? (
        <div className="relative">
          <input
            className={`w-full pr-12 ${INPUT_CLASS} ${borderClass} ${className ?? ''}`}
            {...inputProps}
          />
          {suffix}
        </div>
      ) : (
        <input
          className={`${INPUT_CLASS} ${borderClass} ${className ?? ''}`}
          {...inputProps}
        />
      )}
      {error && (
        <span className="mt-1 text-[length:var(--text-sm)] text-red-500">
          {error}
        </span>
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
  const [fieldErrors, setFieldErrors] = useState<
    Record<'email' | 'password', string>
  >({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: 'email' | 'password') => {
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const authStatus = await validateSessionByReissue();
      if (!isMounted) return;

      // ─── 세션 복원 성공 시 Zustand store 업데이트 ──────────────────────────
      // [문제] 이전 코드: authStatus === 'authenticated' 이면 바로 navigate
      //        → validateSessionByReissue가 userId/role을 반환하지 않아
      //          authLogin()이 호출되지 않음
      //        → Zustand user/role이 null인 채로 HOME에 도달
      //        → 라우터: role === 'OWNER' false → 항상 EmployeeHomePage 렌더링
      //
      // [해결] 현재 코드: authStatus에 userId/role이 포함됨
      //        → authLogin() 호출로 Zustand를 올바른 role로 업데이트
      //        → navigate 후 라우터가 role에 맞는 홈을 렌더링
      //
      // name: persist에 저장된 값 재사용 (없으면 빈 문자열 — 다음 credentials 로그인 시 갱신됨)
      if (authStatus !== 'unauthenticated') {
        const currentState = useAuthStore.getState();

        // ─── 세션 복원 시 activeStoreId 재결정 ────────────────────────────────────
        // [문제] 이전 코드: currentState.activeStoreId를 그대로 재사용
        //        → 최초 로그인이 아닌 새로고침/재접속 시 null이 고정된 채 유지됨
        //        → employee는 최초 로그인 직후에만 activeStoreId가 설정되고,
        //          이후 새로고침 시 null로 고정되어 경매 목록이 표시되지 않는 문제 발생
        //
        // [해결] resolveActiveStoreId(accessToken, role)을 호출해 항상 최신 소속 매장 ID 결정
        //        → OWNER는 /api/v1/stores, EMPLOYEE는 /api/v1/stores/employees/my 호출
        //        → 응답이 비어 있으면 null 반환 (소속 없는 직원 정상 처리)
        //        → OWNER/EMPLOYEE 모두 이 경로를 통해 올바른 activeStoreId가 설정됨
        const activeStoreId = await resolveActiveStoreId(
          authStatus.accessToken,
          authStatus.role
        );

        authLogin(
          {
            id: authStatus.userId,
            name: currentState.user?.name ?? '',
            role: authStatus.role,
          },
          authStatus.accessToken,
          activeStoreId
        );
        // EMPLOYEE이고 소속 매장이 없으면 HOME을 거치지 않고 바로 STORE_JOIN으로 이동
        // HOME을 경유하면 EmployeeHomePage가 잠깐 렌더링되며 불필요한 API 호출이 발생함
        if (authStatus.role === 'EMPLOYEE' && activeStoreId === null) {
          navigate(ROUTES.STORE_JOIN, { replace: true });
        } else {
          navigate(ROUTES.HOME, { replace: true });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [navigate, authLogin]);

  const resolveActiveStoreId = async (
    accessToken: string,
    role: 'OWNER' | 'EMPLOYEE'
  ) => {
    try {
      const stores =
        role === 'OWNER'
          ? await getMyStoresWithToken(accessToken)
          : await getMyEmployeeStoresWithToken(accessToken);
      if (stores.length === 1) return stores[0].storeId;
      if (stores.length > 1) {
        return Math.min(...stores.map((store) => store.storeId));
      }
    } catch {
      return null;
    }

    return null;
  };

  const loginWithCredentials = async (
    nextEmail: string,
    nextPassword: string
  ) => {
    if (isSubmitting) return;

    // ─── 클라이언트 선검증 ────────────────────────────────────────────────────
    const emailError = validateEmailFormat(nextEmail);
    const passwordError = validatePasswordFormat(nextPassword);

    if (emailError || passwordError) {
      setFieldErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login({ email: nextEmail, password: nextPassword });
      if (res.status !== 'SUCCESS') {
        // ─── 로그인 실패 응답 처리 ────────────────────────────────────────────
        // [보안] 이메일 또는 비밀번호 중 어느 것이 틀렸는지 명확히 드러내지 않음
        //        → 비밀번호 필드에만 메시지 표시
        setFieldErrors({
          email: '',
          password: res.message || '로그인에 실패했습니다.',
        });
        return;
      }

      const activeStoreId = await resolveActiveStoreId(
        res.data.accessToken,
        res.data.role
      );

      authLogin(
        { id: res.data.userId, name: res.data.name, role: res.data.role },
        res.data.accessToken,
        activeStoreId
      );

      // EMPLOYEE이고 소속 매장이 없으면 HOME을 거치지 않고 바로 STORE_JOIN으로 이동
      if (res.data.role === 'EMPLOYEE' && activeStoreId === null) {
        navigate(ROUTES.STORE_JOIN, { replace: true });
      } else {
        navigate(ROUTES.HOME, { replace: true });
      }
    } catch (error) {
      // ─── Axios 에러 처리 ─────────────────────────────────────────────────
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message =
          error.response?.data?.message ||
          '이메일 또는 비밀번호가 일치하지 않습니다.';

        if (status === 401) {
          // 401: 인증 실패 (비밀번호 불일치 등)
          setFieldErrors({
            email: '',
            password: message,
          });
        } else if (status === 400) {
          // 400: 요청 오류 (검증 실패 등)
          if (message.includes('비밀번호')) {
            setFieldErrors((prev) => ({ ...prev, password: message }));
          } else if (message.includes('이메일')) {
            setFieldErrors((prev) => ({ ...prev, email: message }));
          }
        }
        // 기타 에러는 조용히 처리 (네트워크 오류 등)
        return;
      }

      // Non-Axios 에러 (예외)
      console.error('Unexpected login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    void loginWithCredentials(email, password);
  };

  const handleTestLogin = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
    void loginWithCredentials(testEmail, testPassword);
  };

  return (
    <div className="min-h-dvh px-[var(--space-6)] py-14 bg-[var(--color-bg-base)] flex justify-center items-center">
      <div className="w-full max-w-96 bg-[var(--color-bg-white)] rounded-[var(--radius-xl)] shadow-xl border border-[var(--color-border-light)] flex flex-col overflow-hidden">
        <div className="flex justify-center p-3.5">
          <span className="text-center text-[length:var(--text-xl)] font-bold text-black leading-6">
            알맹이
          </span>
        </div>

        <div className="px-6 pt-8 pb-4 flex flex-col gap-2">
          <h1 className="text-[length:var(--text-3xl)] font-bold text-[var(--color-text-primary)] leading-10">
            환영합니다!
          </h1>
          <p className="text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)] leading-6">
            알맹이에 로그인하여 시작하세요.
          </p>
        </div>

        <form onSubmit={handleLogin} className="px-6 py-4 flex flex-col gap-4">
          <LabeledInput
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            placeholder="이메일을 입력하세요"
            error={fieldErrors.email}
          />

          <LabeledInput
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError('password');
            }}
            placeholder="비밀번호를 입력하세요"
            error={fieldErrors.password}
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                disabled={isSubmitting}
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
            disabled={isSubmitting}
            className="mt-2 w-full h-14 bg-[var(--color-primary)] rounded-3xl text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)] leading-7 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {IS_TEST_LOGIN_ENABLED && (
          <div className="px-6 pb-4 flex flex-col gap-2">
            <p className="text-center text-[length:var(--text-sm)] font-medium text-[var(--color-text-muted)]">
              테스트 계정으로 바로 로그인
            </p>
            {TEST_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => handleTestLogin(account.email, account.password)}
                disabled={isSubmitting}
                className="w-full h-11 border border-[var(--color-border-muted)] rounded-[var(--radius-lg)] text-[length:var(--text-sm)] font-semibold text-[var(--color-text-primary)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {account.label}
              </button>
            ))}
          </div>
        )}

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

        <div className="h-2 bg-[var(--color-primary)]" />
      </div>
    </div>
  );
}
