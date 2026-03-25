import { Calendar, FileText, House, Store, Users, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import useAuthStore from '@/stores/useAuthStore';

interface NavItem {
  key: string;
  label: string;
  path: string;
  iconName: 'house' | 'calendar' | 'users' | 'wallet' | 'store' | 'documents';
}

const ownerNavItems: NavItem[] = [
  { key: 'home', label: '홈', path: ROUTES.HOME, iconName: 'house' },
  {
    key: 'schedule',
    label: '스케줄',
    path: ROUTES.SCHEDULE,
    iconName: 'calendar',
  },
  { key: 'staff', label: '직원', path: ROUTES.EMPLOYEE, iconName: 'users' },
  { key: 'payroll', label: '급여', path: ROUTES.PAYROLL, iconName: 'wallet' },
  { key: 'store', label: '매장', path: ROUTES.STORE, iconName: 'store' },
];

const employeeNavItems: NavItem[] = [
  { key: 'home', label: '홈', path: ROUTES.HOME, iconName: 'house' },
  {
    key: 'schedule',
    label: '스케줄',
    path: ROUTES.SCHEDULE,
    iconName: 'calendar',
  },
  { key: 'payroll', label: '급여', path: ROUTES.PAYROLL, iconName: 'wallet' },
  {
    key: 'documents',
    label: '문서',
    path: ROUTES.WORKER_DOCUMENTS,
    iconName: 'documents',
  },
];

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

function NavIcon({
  iconName,
  active,
}: {
  iconName: NavItem['iconName'];
  active: boolean;
}) {
  const color = active
    ? 'var(--color-text-primary)'
    : 'var(--color-text-light)';

  switch (iconName) {
    case 'house':
      return (
        <House size={30} color={color} strokeWidth={2} strokeLinejoin="bevel" />
      );
    case 'calendar':
      return (
        <Calendar
          size={29}
          color={color}
          strokeWidth={1.8}
          className="translate-y-[-1px]"
        />
      );
    case 'users':
      return <Users size={30} color={color} strokeWidth={1.8} />;
    case 'wallet':
      return <Wallet size={28} color={color} strokeWidth={1.7} />;
    case 'store':
      return (
        <Store
          size={30}
          color={color}
          strokeWidth={1.8}
          className="translate-y-[2px]"
        />
      );
    case 'documents':
      return <FileText size={28} color={color} strokeWidth={1.8} />;
    default:
      return null;
  }
}

function resolveCurrentTab(pathname: string, navItems: NavItem[]) {
  const matched = navItems.find((item) => {
    if (item.key === 'documents') {
      return (
        pathname === ROUTES.WORKER_DOCUMENTS ||
        pathname.startsWith('/documents/')
      );
    }

    return pathname === item.path;
  });

  return matched?.key ?? 'home';
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useAuthStore((state) => state.user?.role);

  const navItems = role === 'EMPLOYEE' ? employeeNavItems : ownerNavItems;
  const currentTab =
    activeTab ?? resolveCurrentTab(location.pathname, navItems);

  const handleClick = (item: NavItem) => {
    if (onTabChange) {
      onTabChange(item.key);
    }
    navigate(item.path);
  };

  return (
    <div
      className="bg-white flex items-center justify-between rounded-t-[var(--radius-lg)] shrink-0 w-full md:max-w-[600px] fixed bottom-0 left-1/2 -translate-x-1/2 z-[var(--z-nav)] border-t border-[var(--color-border-light)] shadow-[var(--shadow-nav)]"
      style={{
        paddingTop: '5px',
        paddingBottom: 'calc(15px + env(safe-area-inset-bottom, 0px))',
        paddingLeft: '15px',
        paddingRight: '15px',
      }}
    >
      {navItems.map((item) => {
        const isActive = currentTab === item.key;

        return (
          <button
            key={item.key}
            className="flex flex-col gap-[3px] items-center shrink-0 cursor-pointer"
            onClick={() => handleClick(item)}
          >
            <div
              className={`flex items-center justify-center h-[38px] w-[60px] rounded-full ${isActive ? 'bg-[var(--color-primary)]' : ''}`}
            >
              <NavIcon iconName={item.iconName} active={isActive} />
            </div>
            <span
              className={`text-[length:var(--text-xs)] font-bold leading-tight ${isActive ? 'text-[color:var(--color-text-primary)]' : 'text-[color:var(--color-text-light)]'}`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
