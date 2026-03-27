import {
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/common/DetailHeader';
import { signup, checkEmail } from '@/api/auth';

const INPUT_CLASS =
  'h-14 px-4 bg-[var(--color-bg-white)] rounded-[var(--radius-xl)] border text-[length:var(--text-base)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none';

type FieldName = 'name' | 'email' | 'phone' | 'password' | 'passwordConfirm';

const INITIAL_FIELD_ERRORS: Record<FieldName, string> = {
  name: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
};

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
      <label className="px-1 pb-2 text-[length:var(--text-base)] font-medium text-[var(--color-text-secondary)] leading-5">
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
          className={`w-full ${INPUT_CLASS} ${borderClass} ${className ?? ''}`}
          {...inputProps}
        />
      )}
      {error ? (
        <p className="px-1 pt-1 text-[length:var(--text-sm)] text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? '비밀번호 숨기기' : '비밀번호 표시'}
      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
    >
      {show ? (
        <EyeOff size={20} color="var(--color-text-placeholder)" />
      ) : (
        <Eye size={20} color="var(--color-text-placeholder)" />
      )}
    </button>
  );
}

function toPhoneDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

function formatPhoneDigits(digits: string) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatPhoneInput(value: string) {
  return formatPhoneDigits(toPhoneDigits(value));
}

// ─── 중복 이메일 에러 판별 ───────────────────────────────────────────────────
// 백엔드가 이메일 중복 시 HTTP 409 + status: "U002"를 반환
// axios 인터셉터가 4xx를 모두 throw하므로, catch 블록에서 판별 필요
function isDuplicateEmailError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (error.response?.status === 409) return true;
  const code = (error.response?.data as { status?: string })?.status;
  return code === 'U002';
}

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const role =
    (location.state as { role?: 'OWNER' | 'EMPLOYEE' })?.role ?? 'EMPLOYEE';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] =
    useState<Record<FieldName, string>>(INITIAL_FIELD_ERRORS);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = (value: string) => {
    if (!value.trim()) return '이름은 필수입니다.';
    return '';
  };

  const validateEmail = (value: string) => validateEmailFormat(value);

  const validatePhone = (value: string) => {
    const digits = toPhoneDigits(value);
    if (!digits) return '';
    if (digits.length < 10 || digits.length > 11) {
      return '휴대폰 번호 형식이 올바르지 않습니다.';
    }
    return '';
  };

  const validatePassword = (value: string) => validatePasswordFormat(value);

  const validatePasswordConfirm = (
    value: string,
    currentPassword: string = password
  ) => {
    if (!value) return '비밀번호 확인은 필수입니다.';
    if (value !== currentPassword) return '비밀번호가 일치하지 않습니다.';
    return '';
  };

  const getFieldError = (field: FieldName) => {
    if (field === 'name') return validateName(name);
    if (field === 'email') return validateEmail(email);
    if (field === 'phone') return validatePhone(phone);
    if (field === 'password') return validatePassword(password);
    return validatePasswordConfirm(passwordConfirm, password);
  };

  const clearFieldError = (field: FieldName) => {
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: FieldName) => {
    setFieldErrors((prev) => ({ ...prev, [field]: getFieldError(field) }));
  };

  // ─── 이메일 중복 확인 (onBlur 시) ──────────────────────────────────────────
  // [목적] 이메일 입력 완료 후 다른 곳 클릭 시 즉시 중복 여부 확인
  // [로직] 1. 형식 유효성 검사 (validateEmail) → 실패 시 API 호출 없이 반환
  //       2. 형식 통과 → checkEmail API 호출 → exists: true이면 중복 에러 표시
  //       3. API 호출 실패 → 조용히 통과 (제출 시 409로 재검증됨)
  const handleEmailBlur = async () => {
    const formatError = validateEmail(email);
    // 형식이 유효하지 않으면 서버 호출 없이 형식 에러만 표시
    if (formatError) {
      setFieldErrors((prev) => ({ ...prev, email: formatError }));
      return;
    }
    // 형식이 맞으면 서버에 중복 확인
    try {
      const res = await checkEmail(email.trim());
      if (res.data.exists) {
        setFieldErrors((prev) => ({ ...prev, email: '중복된 이메일입니다.' }));
      }
    } catch {
      // 네트워크 오류 등 → 서버 확인 실패 시 조용히 통과 (제출 시 재검증됨)
    }
  };

  const isFormValid =
    !validateName(name) &&
    !validateEmail(email) &&
    !validatePhone(phone) &&
    !validatePassword(password) &&
    !validatePasswordConfirm(passwordConfirm, password) &&
    agreed;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError('');

    const nextErrors: Record<FieldName, string> = {
      name: validateName(name),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
      passwordConfirm: validatePasswordConfirm(passwordConfirm, password),
    };
    setFieldErrors(nextErrors);

    const hasFieldError = Object.values(nextErrors).some(Boolean);
    if (hasFieldError || !agreed) {
      return;
    }

    try {
      setIsSubmitting(true);

      const normalizedPhone = phone.trim();
      const res = await signup({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: normalizedPhone || undefined,
        role,
      });

      if (res.status !== 'SUCCESS') {
        const message = res.message || '회원가입에 실패했습니다.';

        if (res.status === 'U002' || message.includes('이메일')) {
          setFieldErrors((prev) => ({ ...prev, email: message }));
        } else if (message.includes('비밀번호')) {
          setFieldErrors((prev) => ({ ...prev, password: message }));
        } else if (message.includes('이름')) {
          setFieldErrors((prev) => ({ ...prev, name: message }));
        } else if (message.includes('휴대폰') || message.includes('전화')) {
          setFieldErrors((prev) => ({ ...prev, phone: message }));
        } else {
          setFormError(message);
        }
        return;
      }

      navigate(ROUTES.SIGNUP_COMPLETE, { replace: true });
    } catch (error) {
      // ─── 중복 이메일 에러 처리 ────────────────────────────────────────────
      // [목적] 이메일 중복 시 버튼 위 공통 에러가 아닌 이메일 필드 하단에 표시
      // [처리] HTTP 409(중복) 판별 → formError 비우기 → fieldErrors.email에 고정 메시지
      if (isDuplicateEmailError(error)) {
        setFormError('');
        setFieldErrors((prev) => ({ ...prev, email: '중복된 이메일입니다.' }));
      } else {
        setFormError('서버에 연결할 수 없습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-white)]">
      <DetailHeader
        title="회원가입"
        onBack={() => navigate(ROUTES.SIGNUP)}
        accentLine
      />

      <div className="px-4 pt-8 pb-6 flex flex-col gap-2">
        <h1 className="text-[length:var(--text-3xl)] font-bold text-[var(--color-text-primary)] leading-9">
          알맹이의 새로운
          <br />
          멤버가 되어주세요
        </h1>
        <p className="text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)] leading-5">
          간편하게 가입하고 다양한 혜택을 누리세요.
        </p>
      </div>

      <form
        id="signup-form"
        onSubmit={handleSubmit}
        className="flex-1 px-4 pb-32 flex flex-col gap-5"
      >
        <LabeledInput
          label="이름"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearFieldError('name');
            setFormError('');
          }}
          onBlur={() => handleBlur('name')}
          placeholder="실명을 입력해주세요"
          error={fieldErrors.name}
        />

        <LabeledInput
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
            setFormError('');
          }}
          onBlur={() => {
            void handleEmailBlur();
          }}
          placeholder="example@email.com"
          error={fieldErrors.email}
        />

        <LabeledInput
          label="휴대폰 번호"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => {
            setPhone(formatPhoneInput(e.target.value));
            clearFieldError('phone');
            setFormError('');
          }}
          onBlur={() => handleBlur('phone')}
          placeholder="010-0000-0000"
          error={fieldErrors.phone}
        />

        <LabeledInput
          label="비밀번호"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            const nextPassword = e.target.value;
            setPassword(nextPassword);
            clearFieldError('password');
            setFormError('');

            if (passwordConfirm) {
              setFieldErrors((prev) => ({
                ...prev,
                passwordConfirm: validatePasswordConfirm(
                  passwordConfirm,
                  nextPassword
                ),
              }));
            }
          }}
          onBlur={() => handleBlur('password')}
          placeholder="8자 이상 72자 이하, 영문/숫자/특수문자 포함"
          error={fieldErrors.password}
          suffix={
            <PasswordToggle
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          }
        />

        <LabeledInput
          label="비밀번호 확인"
          type={showPasswordConfirm ? 'text' : 'password'}
          value={passwordConfirm}
          onChange={(e) => {
            setPasswordConfirm(e.target.value);
            clearFieldError('passwordConfirm');
            setFormError('');
          }}
          onBlur={() => handleBlur('passwordConfirm')}
          placeholder="비밀번호를 다시 입력해주세요"
          error={fieldErrors.passwordConfirm}
          suffix={
            <PasswordToggle
              show={showPasswordConfirm}
              onToggle={() => setShowPasswordConfirm(!showPasswordConfirm)}
            />
          }
        />

        <label className="px-1 flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded-lg border border-[var(--color-border-muted)] accent-[var(--color-primary)]"
          />
          <span className="text-[length:var(--text-base)] font-medium leading-4">
            <span className="text-[var(--color-text-primary)] underline">
              이용약관
            </span>
            <span className="text-[var(--color-text-muted)]"> 및 </span>
            <span className="text-[var(--color-text-primary)] underline">
              개인정보 처리방침
            </span>
            <span className="text-[var(--color-text-muted)]">
              에 동의합니다.
            </span>
          </span>
        </label>
      </form>

      <div className="sticky bottom-0 p-4 bg-[var(--color-bg-base)]/80 backdrop-blur-sm">
        {formError ? (
          <p className="mb-2 text-center text-[length:var(--text-sm)] text-red-500">
            {formError}
          </p>
        ) : null}
        <button
          type="submit"
          form="signup-form"
          disabled={!isFormValid || isSubmitting}
          className="w-full h-14 bg-[var(--color-primary)] rounded-3xl shadow-md text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)] leading-7 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '처리 중...' : '회원가입'}
        </button>
      </div>
    </div>
  );
}
