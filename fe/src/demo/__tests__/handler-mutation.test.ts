import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';

import { handlers } from '../handlers';
import { resetDemoData } from '../storage';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => resetDemoData());

describe('chat demo mutations', () => {
  it('makes a sent message visible through the later messages request', async () => {
    const sent = await fetch('http://localhost/api/v1/chat/rooms/1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageType: 'TEXT',
        content: '로컬 데모 메시지',
      }),
    });

    expect(sent.status).toBe(200);

    const listed = await fetch('http://localhost/api/v1/chat/rooms/1/messages');
    const body = (await listed.json()) as {
      data: { messages: Array<{ content: string | null }> };
    };

    expect(body.data.messages.map((message) => message.content)).toContain(
      '로컬 데모 메시지'
    );
  });
});
