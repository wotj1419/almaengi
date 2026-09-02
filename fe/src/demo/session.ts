export const DEMO_AUTH_TOKEN = 'demo-preview-access-token';

export type DemoRole = 'OWNER' | 'EMPLOYEE';

export function parseDemoRole(value: string | undefined): DemoRole | null {
  if (value === 'owner') return 'OWNER';
  if (value === 'employee') return 'EMPLOYEE';
  return null;
}

type DemoUser = {
  id: number;
  name: string;
  role: DemoRole;
};

type DemoSession = {
  user: DemoUser;
  activeStoreId: number;
  isLoggedIn: true;
};

const demoUsers: Record<DemoRole, DemoUser> = {
  OWNER: { id: 1, name: '데모 점주', role: 'OWNER' },
  EMPLOYEE: { id: 10, name: '데모 직원', role: 'EMPLOYEE' },
};

export function createDemoSession(role: DemoRole): DemoSession {
  localStorage.setItem('accessToken', DEMO_AUTH_TOKEN);

  return {
    user: demoUsers[role],
    activeStoreId: 1,
    isLoggedIn: true,
  };
}

export function isDemoAccessToken(token: string | null | undefined): boolean {
  return token === DEMO_AUTH_TOKEN;
}

export function clearDemoSession(): void {
  if (isDemoAccessToken(localStorage.getItem('accessToken'))) {
    localStorage.removeItem('accessToken');
  }
}
