import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';

import { handlers } from '../handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

describe('demo handlers', () => {
  it('blocks unknown API routes instead of passing them to a backend', async () => {
    const response = await fetch('http://localhost/api/v1/unknown-demo-route');

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toMatchObject({
      status: 'DEMO_API_NOT_IMPLEMENTED',
    });
  });
});
