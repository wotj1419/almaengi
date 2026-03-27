import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  message?: string;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  showCloseButton?: boolean; // true이면 우측 상단 X 버튼 표시
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  message,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  showCloseButton = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const primaryText = message ?? title ?? '';
  const secondaryText = message ? undefined : description;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] w-[85%] max-w-[510px] overflow-hidden">
        {/* X 닫기 버튼 (showCloseButton이 true일 때만 렌더링) */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-[var(--space-3)] right-[var(--space-3)] p-1 cursor-pointer"
          >
            <X size={20} color="var(--color-text-muted)" />
          </button>
        )}
        <div className="flex flex-col items-center gap-[var(--space-1)] pt-[var(--space-8)] pb-[var(--space-6)] px-[var(--space-6)]">
          <span className="whitespace-pre-line text-center text-[length:var(--text-lg)] font-bold text-[color:var(--color-text-primary)]">
            {primaryText}
          </span>
          {secondaryText && (
            <span className="text-[length:var(--text-base)] text-[color:var(--color-text-muted)]">
              {secondaryText}
            </span>
          )}
        </div>
        {/* confirmText, cancelText가 빈 문자열이면 하단 버튼 영역 숨김 */}
        {(cancelText || confirmText) && (
          <div className="flex gap-[var(--space-2)] px-[var(--space-6)] pb-[var(--space-6)]">
            {cancelText && (
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center h-[44px] bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] text-[length:var(--text-md)] font-bold text-[color:var(--color-text-muted)]"
              >
                {cancelText}
              </button>
            )}
            {confirmText && (
              <button
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center h-[44px] bg-[var(--color-primary)] rounded-[var(--radius-sm)] text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)]"
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
