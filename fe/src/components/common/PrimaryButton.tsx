type Props = {
  label: string;
  onClick?: () => void;
};

export default function PrimaryButton({ label, onClick }: Props) {
  return (
    <button
      className="w-full bg-[var(--color-primary)] text-[color:var(--color-text-primary)] font-bold text-[length:var(--text-lg)] py-[var(--space-4)] rounded-[var(--radius-lg)] cursor-pointer shadow-[var(--shadow-card)]"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
