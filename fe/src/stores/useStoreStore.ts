import { create } from 'zustand';
import type { StoreInfo } from '@/api/store';

interface StoreState {
  stores: StoreInfo[];
  currentStore: StoreInfo | null;
  inviteCode: string | null;
  inviteCodeExpiredAt: string | null;
  setStores: (stores: StoreInfo[]) => void;
  selectStore: (store: StoreInfo) => void;
  setInviteCode: (code: string, expiredAt: string) => void;
  clearInviteCode: () => void;
}

const useStoreStore = create<StoreState>((set) => ({
  stores: [],
  currentStore: null,
  inviteCode: null,
  inviteCodeExpiredAt: null,
  setStores: (stores) => set({ stores, currentStore: stores[0] ?? null }),
  selectStore: (store) => set({ currentStore: store }),
  setInviteCode: (code, expiredAt) =>
    set({ inviteCode: code, inviteCodeExpiredAt: expiredAt }),
  clearInviteCode: () => set({ inviteCode: null, inviteCodeExpiredAt: null }),
}));

export default useStoreStore;
