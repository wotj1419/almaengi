import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Props = {
  title: string;
  rightLabel?: string;
  rightIcon?: ReactNode;
  onRightClick?: () => void;
  onBack?: () => void;
};

export default function DetailHeader({
  title,
  rightLabel,
  rightIcon,
  onRightClick,
  onBack,
}: Props) {
  const navigate = useNavigate();

  return (
    <div
      className="relative w-full flex items-center justify-center bg-[var(--color-bg-white)] px-0 pb-[var(--space-7)]"
      style={{ paddingTop: 'calc(40px + env(safe-area-inset-top, 0px))' }}
    >
      <button
        className="absolute left-[var(--space-5)] cursor-pointer"
        onClick={() => (onBack ? onBack() : navigate(-1))}
      >
        <ArrowLeft
          size={22}
          color="var(--color-text-primary)"
          strokeWidth={2}
        />
      </button>
      <span className="text-[length:var(--text-xl)] text-[color:var(--color-text-primary)] font-bold font-['Noto_Sans_KR:Bold',sans-serif]">
        {title}
      </span>
      {(rightLabel || rightIcon) && (
        <button
          className="absolute right-[var(--space-5)] cursor-pointer text-[length:var(--text-xl)] text-[color:var(--color-text-primary)] font-bold font-['Noto_Sans_KR:Bold',sans-serif]"
          onClick={onRightClick}
        >
          {rightIcon ?? rightLabel}
        </button>
      )}
    </div>
  );
}
