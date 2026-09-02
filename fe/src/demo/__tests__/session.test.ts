import { afterEach, describe, expect, it } from 'vitest';

import {
  clearDemoSession,
  createDemoSession,
  DEMO_AUTH_TOKEN,
  isDemoAccessToken,
} from '../session';

afterEach(() => {
  clearDemoSession();
});

describe('createDemoSession', () => {
  it('creates an owner session compatible with the auth store', () => {
    const session = createDemoSession('OWNER');

    expect(session).toEqual({
      user: { id: 1, name: '데모 점주', role: 'OWNER' },
      activeStoreId: 1,
      isLoggedIn: true,
    });
    expect(localStorage.getItem('accessToken')).toBe(DEMO_AUTH_TOKEN);
  });

  it('creates an employee session compatible with the auth store', () => {
    const session = createDemoSession('EMPLOYEE');

    expect(session).toEqual({
      user: { id: 10, name: '데모 직원', role: 'EMPLOYEE' },
      activeStoreId: 1,
      isLoggedIn: true,
    });
    expect(localStorage.getItem('accessToken')).toBe(DEMO_AUTH_TOKEN);
  });
});

describe('demo session helpers', () => {
  it('identifies only the demo access token and clears it', () => {
    createDemoSession('OWNER');

    expect(isDemoAccessToken(DEMO_AUTH_TOKEN)).toBe(true);
    expect(isDemoAccessToken('production-token')).toBe(false);

    clearDemoSession();

    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
