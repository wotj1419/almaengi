import { FileText, BarChart2, Pin, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActionCardProps {
  title: string;
  bgColor: string;
  textColor?: string;
  iconColor: string;
  icon: 'todo' | 'schedule' | 'board' | 'clock';
  showNewBadge?: boolean;
  path: string;
  state?: Record<string, string>;
}

export default function ActionCard({
  title,
  bgColor,
  textColor = 'text-[color:var(--color-text-primary)]',
  iconColor,
  icon,
  showNewBadge = false,
  path,
  state,
}: ActionCardProps) {
  const navigate = useNavigate();
  const renderIcon = () => {
    switch (icon) {
      case 'todo':
        return <FileText size={24} color={iconColor} strokeWidth={1.8} />;
      case 'schedule':
        return <BarChart2 size={24} color={iconColor} strokeWidth={2} />;
      case 'board':
        return <Pin size={24} color={iconColor} strokeWidth={2} />;
      case 'clock':
        return <RefreshCw size={24} color={iconColor} strokeWidth={2} />;
    }
  };

  return (
    <div
      className={`${bgColor} h-[110px] relative rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] shrink-0 cursor-pointer`}
      onClick={() => navigate(path, { state })}
    >
      <div className="flex flex-col justify-between p-[var(--space-7)] size-full">
        <p
          className={`${textColor} text-[length:var(--text-xl)] font-bold leading-tight`}
        >
          {title}
        </p>
        <div className="flex justify-end">{renderIcon()}</div>
      </div>
      {showNewBadge && (
        <button className="absolute flex items-center justify-center bg-[var(--color-badge-new)] h-[17px] px-[var(--space-3)] right-[var(--space-3)] rounded-[var(--radius-xl)] top-[var(--space-3)] w-[25px]">
          <span className="text-[length:var(--text-xs)] font-medium text-white">
            N
          </span>
        </button>
      )}
    </div>
  );
}
