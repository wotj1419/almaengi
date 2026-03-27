// ─── 이메일 검증 ────────────────────────────────────────────────────────────
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailFormat(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '이메일은 필수입니다.';
  if (!EMAIL_REGEX.test(trimmed)) return '올바른 이메일 형식이 아닙니다.';
  return '';
}

// ─── 비밀번호 검증 ──────────────────────────────────────────────────────────
export const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,72}$/;

export function validatePasswordFormat(value: string): string {
  if (!value) return '비밀번호를 입력해주세요.';
  if (!PASSWORD_REGEX.test(value)) {
    return '비밀번호는 8자 이상 72자 이하, 영문/숫자/특수문자를 포함해야 합니다.';
  }
  return '';
}
