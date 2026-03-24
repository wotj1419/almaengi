import type { ReactNode } from 'react';

interface RequestSectionProps {
  title: string;
  children: ReactNode;
}

interface RequestFieldLabelProps {
  label: string;
}

interface RequestTextInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  type?: 'text' | 'number' | 'time' | 'date';
  placeholder?: string;
  suffix?: ReactNode;
  align?: 'left' | 'right';
}

interface RequestTextAreaProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
}

interface RequestPickerFieldProps {
  label: string;
  value: string;
  placeholder: string;
  icon: ReactNode;
  onClick: () => void;
}

export function RequestSection({ title, children }: RequestSectionProps) {
  return (
    <section className="space-y-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] p-[var(--space-5)] shadow-[var(--shadow-form-card)]">
      <h2 className="text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function RequestFieldLabel({ label }: RequestFieldLabelProps) {
  return (
    <label className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
      {label}
    </label>
  );
}

export function RequestTextInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  suffix,
  align = 'left',
}: RequestTextInputProps) {
  return (
    <div className="relative w-full">
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] text-[length:var(--text-sm)] text-[var(--color-text-primary)] outline-none ${
          suffix ? 'pl-[var(--space-3)] pr-8' : 'px-[var(--space-3)]'
        } ${align === 'right' ? 'text-right' : 'text-left'}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function RequestTextArea({
  value,
  onChange,
  placeholder,
}: RequestTextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-24 w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
    />
  );
}

export function RequestPickerField({
  label,
  value,
  placeholder,
  icon,
  onClick,
}: RequestPickerFieldProps) {
  return (
    <div className="space-y-[var(--space-2)]">
      <RequestFieldLabel label={label} />
      <button
        type="button"
        onClick={onClick}
        className="flex h-11 w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] px-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--color-text-primary)]"
      >
        <span className={value ? '' : 'text-[var(--color-text-placeholder)]'}>
          {value || placeholder}
        </span>
        {icon}
      </button>
    </div>
  );
}
