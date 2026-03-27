import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreInfo } from '@/api/store';

interface InviteCodeEntry {
  code: string;
  expiredAt: string;
}

interface StoreState {
  stores: StoreInfo[];
  currentStore: StoreInfo | null;
  inviteCodes: Record<number, InviteCodeEntry>;
  setStores: (stores: StoreInfo[]) => void;
  selectStore: (store: StoreInfo) => void;
  setInviteCode: (storeId: number, code: string, expiredAt: string) => void;
  clearInviteCode: () => void;
}

const useStoreStore = create<StoreState>()(
  persist(
    (set) => ({
      stores: [],
      currentStore: null,
      inviteCodes: {},
      setStores: (stores) =>
        set((state) => {
          const matched = state.currentStore
            ? stores.find((s) => s.storeId === state.currentStore!.storeId)
            : null;
          return { stores, currentStore: matched ?? stores[0] ?? null };
        }),
      selectStore: (store) => set({ currentStore: store }),
      setInviteCode: (storeId, code, expiredAt) =>
        set((state) => ({
          inviteCodes: { ...state.inviteCodes, [storeId]: { code, expiredAt } },
        })),
      clearInviteCode: () => set({ inviteCodes: {} }),
    }),
    {
      name: 'store-storage',
      partialize: (state) => ({
        currentStore: state.currentStore,
        inviteCodes: state.inviteCodes,
      }),
    }
  )
);

export default useStoreStore;
