import { TABS, type Tab } from '../types';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function AttendanceTabBar({ activeTab, onTabChange }: Props) {
  return (
    <div className="bg-[var(--color-bg-white)] flex border-b border-[var(--color-border-light)]">
      {TABS.map((tab) => (
        <button
          key={tab}
          className={`flex-1 py-[var(--space-3)] cursor-pointer border-b-4 ${activeTab === tab ? 'border-[var(--color-primary)]' : 'border-transparent'}`}
          onClick={() => onTabChange(tab)}
        >
          <span
            className={`text-[length:var(--text-md)] leading-[var(--leading-normal)] ${activeTab === tab ? 'font-bold text-[color:var(--color-text-primary)]' : 'font-medium text-[color:var(--color-text-sub)]'}`}
          >
            {tab}
          </span>
        </button>
      ))}
    </div>
  );
}
