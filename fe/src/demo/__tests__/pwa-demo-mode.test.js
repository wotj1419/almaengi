import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const mainPath = resolve(process.cwd(), 'src/main.tsx');

describe('Preview demo bootstrap', () => {
  it('does not register the PWA service worker in demo mode', () => {
    const source = readFileSync(mainPath, 'utf8');

    expect(source).toMatch(/if\s*\(!isDemoMode\(\)\)\s*\{\s*registerSW\(/);
  });
});