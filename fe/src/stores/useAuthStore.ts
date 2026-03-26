import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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

/**
 * ─── 사용자 인증 상태 관리 스토어 ───────────────────────────────────────────
 * [변경 사항] Zustand persist 미들웨어 오류 수정
 *
 * [문제]
 * - 이전: create<T>((set) => ({ persist(...) })) 형태로 persist를 객체 메서드로 정의
 *   → persist가 실제 미들웨어로 작동하지 않음
 *   → user/role이 localStorage에 저장되지 않음
 *   → 새로고침 시 user가 undefined → role도 undefined → EMPLOYEE 기본값으로 떨어짐
 *
 * [해결]
 * - 현재: create<T>()(persist(...)) 형태로 persist를 미들웨어로 올바르게 래핑
 *   → user/role/isLoggedIn이 localStorage('auth-storage')에 저장됨
 *   → 새로고침 시 persist 미들웨어가 자동으로 복원
 *   → role이 'OWNER' 또는 'EMPLOYEE'로 올바르게 유지됨
 *
 * [기술 세부사항]
 * - create<T>()()는 Zustand v4에서 TypeScript 제네릭 추론을 위한 필수 패턴
 * - persist(initializer, config)가 미들웨어로 정확히 작동
 * - partialize: 액션(함수)은 직렬화 불가능하므로 상태값만 저장
 * ─────────────────────────────────────────────────────────────────────────── */
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        activeStoreId: state.activeStoreId,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export default useAuthStore;
