export type Tab = '대기' | '승인' | '거절';

export const TABS: Tab[] = ['대기', '승인', '거절'];

export const STATUS_ORDER: Record<string, number> = {
  대기: 0,
  승인: 1,
  거절: 2,
};

export const STATUS_STYLES: Record<
  string,
  { border: string; avatarBg: string }
> = {
  대기: {
    border: 'border-[var(--color-status-purple-border)]',
    avatarBg: 'bg-[var(--color-status-purple-border)]',
  },
  승인: {
    border: 'border-[var(--color-status-green-border)]',
    avatarBg: 'bg-[var(--color-status-green-border)]',
  },
  거절: {
    border: 'border-[var(--color-status-orange-border)]',
    avatarBg: 'bg-[var(--color-status-orange-border)]',
  },
};
