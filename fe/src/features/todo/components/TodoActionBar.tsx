type Props = {
  secondaryLabel: string;
  onSecondary: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  fixed?: boolean;
};

export default function TodoActionBar({
  secondaryLabel,
  onSecondary,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  fixed = true,
}: Props) {
  const buttons = (
    <div className="flex gap-[var(--space-4)] w-full">
      <button
        onClick={onSecondary}
        className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-border-light)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
      >
        <span className="text-[length:var(--text-md)] text-[color:var(--color-text-sub)] font-bold">
          {secondaryLabel}
        </span>
      </button>
      {primaryLabel && onPrimary && (
        <button
          onClick={primaryDisabled ? undefined : onPrimary}
          disabled={primaryDisabled}
          className={`flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] flex items-center justify-center ${
            primaryDisabled
              ? 'bg-[var(--color-border-light)] cursor-not-allowed'
              : 'bg-[var(--color-action-todo)] cursor-pointer'
          }`}
        >
          <span
            className={`text-[length:var(--text-md)] font-bold ${
              primaryDisabled
                ? 'text-[color:var(--color-text-sub)]'
                : 'text-[color:var(--color-text-primary)]'
            }`}
          >
            {primaryLabel}
          </span>
        </button>
      )}
    </div>
  );

  if (!fixed) return buttons;

  return (
    <div className="fixed bottom-[80px] left-0 right-0 z-[var(--z-nav)] flex justify-center">
      <div className="w-full max-w-[600px] px-[var(--space-5)] py-[var(--space-3)]">
        {buttons}
      </div>
    </div>
  );
}
