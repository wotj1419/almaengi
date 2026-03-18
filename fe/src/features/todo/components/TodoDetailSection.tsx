type Props = {
  detail: string;
  onDetailChange: (v: string) => void;
};

export default function TodoDetailSection({ detail, onDetailChange }: Props) {
  return (
    <div className="flex flex-col gap-[var(--space-3)] w-full">
      <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold leading-5">
        상세 내용
      </span>
      <textarea
        value={detail}
        onChange={(e) => onDetailChange(e.target.value)}
        placeholder="할 일에 대한 상세 정보를 입력해주세요."
        className="w-full h-[var(--size-textarea-h)] p-[var(--space-4)] rounded-[var(--radius-xs)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-medium leading-5 resize-none outline-none placeholder:text-[color:var(--color-text-placeholder)]"
      />
    </div>
  );
}
