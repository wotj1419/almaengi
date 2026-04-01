import { Outlet } from 'react-router-dom';

export default function AuctionLayout() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="w-full max-w-[var(--max-w-app)] mx-auto">
        <Outlet />
      </div>
    </div>
  );
}
