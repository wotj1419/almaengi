import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  role: 'OWNER' | 'EMPLOYEE';
}

interface AuthState {
  user: User | null;
  activeStoreId: number | null;
  isLoggedIn: boolean;
  login: (user: User, token: string, activeStoreId: number | null) => void;
  setActiveStoreId: (storeId: number | null) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  activeStoreId: null,
  isLoggedIn: false,

  login: (user, token, activeStoreId) => {
    localStorage.setItem('accessToken', token);
    set({ user, activeStoreId, isLoggedIn: true });
  },

  setActiveStoreId: (storeId) => set({ activeStoreId: storeId }),

  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, activeStoreId: null, isLoggedIn: false });
  },
}));

export default useAuthStore;
