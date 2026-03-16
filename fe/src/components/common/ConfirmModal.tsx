interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center">
      {/* 딤 배경 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* 모달 */}
      <div className="relative bg-white rounded-[var(--radius-lg)] w-[85%] max-w-[510px] overflow-hidden">
        <div className="flex flex-col items-center gap-[var(--space-1)] pt-[var(--space-8)] pb-[var(--space-6)]">
          <span className="text-[length:var(--text-lg)] font-bold text-[color:var(--color-text-primary)]">
            {title}
          </span>
          {description && (
            <span className="text-[length:var(--text-base)] text-[color:var(--color-text-muted)]">
              {description}
            </span>
          )}
        </div>
        <div className="flex gap-[var(--space-2)] px-[var(--space-6)] pb-[var(--space-6)]">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center h-[44px] bg-[var(--color-bg-surface)] rounded-[var(--radius-sm)] text-[length:var(--text-md)] font-bold text-[color:var(--color-text-muted)]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center h-[44px] bg-[var(--color-primary)] rounded-[var(--radius-sm)] text-[length:var(--text-md)] font-bold text-[color:var(--color-text-primary)]"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
