import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseDemoRole } from '../session';
import { validateSessionByReissue } from '@/api/session';

afterEach(() => vi.unstubAllEnvs());

describe('parseDemoRole', () => {
  it('accepts URL role values and rejects unknown roles', () => {
    expect(parseDemoRole('owner')).toBe('OWNER');
    expect(parseDemoRole('employee')).toBe('EMPLOYEE');
    expect(parseDemoRole('admin')).toBeNull();
  });
});

describe('demo session guard', () => {
  it('does not revalidate through fetch in demo mode', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(validateSessionByReissue()).resolves.toBe('unauthenticated');

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
