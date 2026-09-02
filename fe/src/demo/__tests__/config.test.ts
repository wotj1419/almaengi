import { describe, expect, it } from 'vitest';

import { isDemoMode } from '../config';

describe('isDemoMode', () => {
  it('enables demo mode only for the exact lowercase true value', () => {
    expect(isDemoMode({ VITE_DEMO_MODE: 'true' })).toBe(true);
    expect(isDemoMode()).toBe(false);
    expect(isDemoMode({ VITE_DEMO_MODE: 'TRUE' })).toBe(false);
    expect(isDemoMode({ VITE_DEMO_MODE: '1' })).toBe(false);
    expect(isDemoMode({ VITE_DEMO_MODE: 'false' })).toBe(false);
  });
});
