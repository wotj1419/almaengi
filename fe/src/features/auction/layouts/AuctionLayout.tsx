import { Outlet } from 'react-router-dom';

export default function AuctionLayout() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg-base)]">
      <div className="w-full md:max-w-[600px] mx-auto">
        <Outlet />
      </div>
    </div>
  );
}
