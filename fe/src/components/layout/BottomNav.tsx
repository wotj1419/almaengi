import { House, Calendar, Users, Wallet, Store } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

type NavItem = {
  label: string;
  iconName: string;
  path: string;
};

const navItems: NavItem[] = [
  { label: '홈', iconName: 'house', path: ROUTES.HOME },
  { label: '스케줄', iconName: 'calendar', path: ROUTES.SCHEDULE },
  { label: '직원', iconName: 'users', path: ROUTES.EMPLOYEE },
  { label: '급여', iconName: 'wallet', path: ROUTES.PAYROLL },
  { label: '매장', iconName: 'store', path: ROUTES.STORE },
];

function NavIcon({ iconName, active }: { iconName: string; active: boolean }) {
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
    default:
      return null;
  }
}

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

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
        const active = location.pathname === item.path;
        return (
          <div
            key={item.label}
            className="flex flex-col gap-[3px] items-center shrink-0 cursor-pointer"
            onClick={() => navigate(item.path)}
          >
            <div
              className={`flex items-center justify-center h-[38px] w-[60px] rounded-full ${active ? 'bg-[var(--color-primary)]' : ''}`}
            >
              <NavIcon iconName={item.iconName} active={active} />
            </div>
            <span
              className={`text-[length:var(--text-xs)] font-bold leading-tight ${active ? 'text-[color:var(--color-text-primary)]' : 'text-[color:var(--color-text-light)]'}`}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
