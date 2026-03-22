import {
  Clock,
  CheckCircle2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import type { TodoStatus } from '@/features/todo/types';

const STATUS_STYLES: Record<
  TodoStatus,
  { bg: string; border: string; text: string }
> = {
  진행중: {
    bg: 'bg-[var(--color-status-green-bg)]',
    border: 'border-[var(--color-status-green-border)]',
    text: 'text-[color:var(--color-status-green-dot)]',
  },
  완료: {
    bg: 'bg-[var(--color-status-purple-bg)]',
    border: 'border-[var(--color-status-purple-border)]',
    text: 'text-[color:var(--color-status-purple-dot)]',
  },
  미완료: {
    bg: 'bg-[var(--color-status-orange-bg)]',
    border: 'border-[var(--color-status-orange-border)]',
    text: 'text-[color:var(--color-status-orange-dot)]',
  },
};

const STATUS_ICONS: Record<TodoStatus, LucideIcon> = {
  진행중: Clock,
  완료: CheckCircle2,
  미완료: AlertCircle,
};

type Props = { status: TodoStatus };

export default function StatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status];
  const Icon = STATUS_ICONS[status];

  return (
    <span
      className={`flex items-center gap-[var(--space-1)] px-[var(--space-3)] py-[var(--space-1)] rounded-full w-fit ${style.bg}`}
    >
      <Icon size={12} className={style.text} />
      <span className={`text-[length:var(--text-xs)] font-bold ${style.text}`}>
        {status}
      </span>
    </span>
  );
}
