import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';

import { handlers } from '../handlers';
import { resetDemoData } from '../storage';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
afterEach(() => resetDemoData());

describe('review regressions', () => {
  it('blocks unknown non-v1 API routes instead of bypassing to a backend', async () => {
    const response = await fetch('http://localhost/api/legacy-health');

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toMatchObject({
      status: 'DEMO_API_NOT_IMPLEMENTED',
    });
  });

  it('persists chat reads and derives room unread counts from them', async () => {
    const beforeRead = await fetch(
      'http://localhost/api/v1/chat/stores/1/rooms'
    );
    const beforeBody = (await beforeRead.json()) as {
      data: Array<{ roomId: number; unreadCount: number }>;
    };
    expect(beforeBody.data.find((room) => room.roomId === 1)?.unreadCount).toBe(
      1
    );

    await fetch('http://localhost/api/v1/chat/rooms/1/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastReadMessageId: 1 }),
    });

    const afterRead = await fetch(
      'http://localhost/api/v1/chat/stores/1/rooms'
    );
    const afterBody = (await afterRead.json()) as {
      data: Array<{ roomId: number; unreadCount: number }>;
    };
    expect(afterBody.data.find((room) => room.roomId === 1)?.unreadCount).toBe(
      0
    );
  });

  it('returns transferable owner payroll rows required by payroll screens', async () => {
    const response = await fetch('http://localhost/api/v1/stores/1/payrolls');
    const body = (await response.json()) as {
      data: {
        employees: Array<{
          isTransferred?: boolean;
          transferredAt?: string | null;
        }>;
      };
    };

    expect(body.data.employees[0]).toMatchObject({
      isTransferred: false,
      transferredAt: null,
    });
  });
});
