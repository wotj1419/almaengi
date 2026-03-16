import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  role: 'OWNER' | 'WORKER';
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,

  login: (user, token) => {
    localStorage.setItem('accessToken', token);
    set({ user, isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, isLoggedIn: false });
  },
}));

export default useAuthStore;
