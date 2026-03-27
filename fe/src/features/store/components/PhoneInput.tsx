import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const PHONE_PREFIXES = [
  '010',
  '011',
  '016',
  '017',
  '018',
  '019',
  '02',
  '031',
  '032',
  '033',
  '041',
  '042',
  '043',
  '044',
  '051',
  '052',
  '053',
  '054',
  '055',
  '061',
  '062',
  '063',
  '064',
  '070',
];

type Props = {
  prefix: string;
  mid: string;
  last: string;
  onPrefixChange: (prefix: string) => void;
  onMidChange: (mid: string) => void;
  onLastChange: (last: string) => void;
};

export default function PhoneInput({
  prefix,
  mid,
  last,
  onPrefixChange,
  onMidChange,
  onLastChange,
}: Props) {
  const [isPrefixOpen, setIsPrefixOpen] = useState(false);
  const midRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  const handlePrefixSelect = (value: string) => {
    onPrefixChange(value);
    setIsPrefixOpen(false);
    midRef.current?.focus();
  };

  const handleMidChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    onMidChange(digits);
    if (digits.length === 4) lastRef.current?.focus();
  };

  const handleLastChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    onLastChange(digits);
    if (digits.length === 4) lastRef.current?.blur();
  };

  return (
    <div className="flex items-center gap-[var(--space-2)] w-full">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setIsPrefixOpen((v) => !v)}
          className="flex items-center justify-center gap-1 w-20 h-14 px-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)] cursor-pointer"
        >
          {prefix}
          <ChevronDown
            size={16}
            color="var(--color-text-placeholder)"
            strokeWidth={2}
          />
        </button>
        {isPrefixOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsPrefixOpen(false)}
            />
            <ul className="absolute top-[calc(100%+4px)] left-0 z-20 w-24 max-h-48 overflow-y-auto bg-[var(--color-bg-white)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] shadow-[var(--shadow-form-card)]">
              {PHONE_PREFIXES.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => handlePrefixSelect(p)}
                    className={`w-full px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--text-md2)] cursor-pointer ${
                      p === prefix
                        ? 'font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-base)]'
                        : 'font-medium text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <input
        ref={midRef}
        type="tel"
        inputMode="numeric"
        value={mid}
        onChange={(e) => handleMidChange(e.target.value)}
        placeholder="0000"
        maxLength={4}
        className="flex-1 min-w-0 h-14 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] px-[var(--space-3)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none text-center"
      />

      <span className="text-[var(--color-text-muted)] font-medium shrink-0">
        -
      </span>

      <input
        ref={lastRef}
        type="tel"
        inputMode="numeric"
        value={last}
        onChange={(e) => handleLastChange(e.target.value)}
        placeholder="0000"
        maxLength={4}
        className="flex-1 min-w-0 h-14 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] px-[var(--space-3)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none text-center"
      />
    </div>
  );
}
