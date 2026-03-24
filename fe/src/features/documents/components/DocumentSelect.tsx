import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SelectOption {
  label: string;
  value: string;
}

interface DocumentSelectProps {
  label: string;
  value: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
      {label}
    </label>
  );
}

export default function DocumentSelect({
  label,
  value,
  placeholder = '선택해주세요',
  options,
  onChange,
}: DocumentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label ?? '';

  return (
    <div className="relative z-10 space-y-[var(--space-2)]">
      <FieldLabel label={label} />
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--color-text-primary)]"
      >
        <span
          className={displayValue ? '' : 'text-[var(--color-text-placeholder)]'}
        >
          {displayValue || placeholder}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-[var(--color-text-secondary)] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute left-0 right-0 top-full z-20 mt-[var(--space-1)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] shadow-[var(--shadow-dropdown)]">
            <div className="max-h-60 overflow-y-auto py-[var(--space-1)]">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full items-center px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--text-sm)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)]"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
