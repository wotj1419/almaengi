import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/common/DetailHeader';

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
      <label className="px-1 pb-2 text-[length:var(--text-base)] font-medium text-[var(--color-text-secondary)] leading-5">
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

export default function SignupPage() {
  const navigate = useNavigate();
  // TODO: 회원가입 API 연동 시 사용
  // const location = useLocation();
  // const role = (location.state as { role?: string })?.role;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const isFormValid =
    name.trim() !== '' &&
    email.trim() !== '' &&
    phone.trim() !== '' &&
    password.length >= 8 &&
    password === passwordConfirm &&
    agreed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    // TODO: 회원가입 API 연동
    navigate(ROUTES.SIGNUP_COMPLETE, { replace: true });
  };

  const handleClick = () => {
    if (!isFormValid) return;
    // TODO: 회원가입 API 연동
    navigate(ROUTES.SIGNUP_COMPLETE, { replace: true });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-white)]">
      {/* 헤더 */}
      <DetailHeader
        title="회원가입"
        onBack={() => navigate(ROUTES.SIGNUP)}
        accentLine
      />

      {/* 안내 메시지 */}
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

      {/* 폼 */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 px-4 pb-32 flex flex-col gap-5"
      >
        <LabeledInput
          label="이름"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="실명을 입력해주세요"
        />

        <LabeledInput
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
        />

        <LabeledInput
          label="휴대폰 번호"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-0000-0000"
        />

        <LabeledInput
          label="비밀번호"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8자 이상 입력해주세요"
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
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="비밀번호를 다시 입력해주세요"
          suffix={
            <PasswordToggle
              show={showPasswordConfirm}
              onToggle={() => setShowPasswordConfirm(!showPasswordConfirm)}
            />
          }
        />

        {/* 이용약관 동의 */}
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

      {/* 하단 고정 버튼 */}
      <div className="sticky bottom-0 p-4 bg-[var(--color-bg-base)]/80 backdrop-blur-sm">
        <button
          type="button"
          onClick={handleClick}
          disabled={!isFormValid}
          className="w-full h-14 bg-[var(--color-primary)] rounded-3xl shadow-md text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)] leading-7 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          회원가입
        </button>
      </div>
    </div>
  );
}
