// Schedule 모달 계열 UI를 한 곳에서 관리해
// 화면 간 규격 차이와 스타일 중복을 줄인다.
export const SCHEDULE_MODAL_PANEL_CLASS =
  'relative w-full max-w-[var(--size-modal-sm)] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-bg-white)] shadow-[var(--shadow-alert)]';

export const SCHEDULE_MODAL_HEADER_CLASS =
  'px-[var(--space-7)] pt-[var(--space-7)] pb-[var(--space-4)] text-center';

export const SCHEDULE_MODAL_BODY_CLASS =
  'bg-[var(--color-bg-white)] px-[var(--space-4)] pb-[var(--space-4)]';

export const SCHEDULE_MODAL_BODY_WITH_Y_PADDING_CLASS =
  'bg-[var(--color-bg-white)] px-[var(--space-4)] py-[var(--space-4)]';

export const SCHEDULE_MODAL_FOOTER_CLASS =
  'flex gap-[var(--space-2)] bg-[var(--color-bg-base)] px-[var(--space-4)] py-[var(--space-4)]';

export const SCHEDULE_MODAL_SECONDARY_BUTTON_CLASS =
  'h-11 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] text-[length:var(--text-md)] font-bold text-[var(--color-text-muted)]';

export const SCHEDULE_MODAL_PRIMARY_BUTTON_CLASS =
  'h-11 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md)] font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50';
