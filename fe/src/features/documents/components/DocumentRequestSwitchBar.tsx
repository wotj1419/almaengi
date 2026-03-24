import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

interface DocumentRequestSwitchBarProps {
  active: 'CONTRACT' | 'ETC';
}

export default function DocumentRequestSwitchBar({
  active,
}: DocumentRequestSwitchBarProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-2)] shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={() => navigate(ROUTES.DOCUMENTS_REQUEST)}
        className={`h-10 rounded-[var(--radius-md)] text-[length:var(--text-sm)] font-bold ${
          active === 'CONTRACT'
            ? 'bg-[var(--color-primary)] text-[var(--color-text-primary)]'
            : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]'
        }`}
      >
        근로계약서
      </button>
      <button
        type="button"
        onClick={() => navigate(ROUTES.DOCUMENTS_REQUEST_ETC)}
        className={`h-10 rounded-[var(--radius-md)] text-[length:var(--text-sm)] font-bold ${
          active === 'ETC'
            ? 'bg-[var(--color-primary)] text-[var(--color-text-primary)]'
            : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]'
        }`}
      >
        기타 문서
      </button>
    </div>
  );
}
