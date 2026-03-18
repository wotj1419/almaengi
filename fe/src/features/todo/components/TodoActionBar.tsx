type Props = {
  secondaryLabel: string;
  primaryLabel: string;
  onSecondary: () => void;
  onPrimary: () => void;
  fixed?: boolean;
};

export default function TodoActionBar({
  secondaryLabel,
  primaryLabel,
  onSecondary,
  onPrimary,
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
      <button
        onClick={onPrimary}
        className="flex-1 py-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-action-todo)] shadow-[var(--shadow-card)] flex items-center justify-center cursor-pointer"
      >
        <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold">
          {primaryLabel}
        </span>
      </button>
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
