import { type ReactNode } from 'react';

interface RoleCardProps {
  role: 'OWNER' | 'EMPLOYEE';
  title: string;
  description: ReactNode;
  image: string;
  selected: boolean;
  onSelect: () => void;
}

export default function RoleCard({
  role,
  title,
  description,
  image,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full h-48 bg-[var(--color-bg-white)] rounded-3xl shadow-lg flex items-center overflow-hidden cursor-pointer border-4 transition-colors ${
        selected
          ? 'border-[var(--color-primary)]'
          : 'border-[var(--color-bg-white)]'
      }`}
    >
      <img
        className={`w-36 h-48 object-cover ${
          role === 'EMPLOYEE' ? 'translate-y-2' : ''
        }`}
        src={image}
        alt={title}
      />
      <div className="flex-1 p-5 flex flex-col items-start gap-1">
        <h3 className="text-[length:var(--text-xl)] font-bold text-[var(--color-text-primary)] leading-6">
          {title}
        </h3>
        <p className="pt-1 text-[length:var(--text-base)] font-medium text-[var(--color-text-muted)] leading-5 text-left">
          {description}
        </p>
      </div>
    </button>
  );
}
