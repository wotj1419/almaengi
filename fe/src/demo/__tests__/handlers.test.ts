import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';

import { handlers } from '../handlers';
import { readDemoData, resetDemoData, writeDemoData } from '../storage';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

afterEach(() => {
  resetDemoData();
});

describe('demo storage', () => {
  it('persists a closed seed auction across reads', () => {
    const data = readDemoData();
    const auction = data.auctions.find((item) => item.auctionId === 1);

    expect(auction).toBeDefined();
    if (!auction) throw new Error('seed auction 1 is required');

    auction.status = 'CLOSED';
    writeDemoData(data);

    expect(
      readDemoData().auctions.find((item) => item.auctionId === 1)?.status
    ).toBe('CLOSED');
  });
});

describe('demo document handlers', () => {
  it('returns a browser-renderable PDF payslip document', async () => {
    const response = await fetch(
      'http://localhost/api/v1/stores/1/payrolls/1/payslip'
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
    const pdfText = await response.text();

    expect(pdfText).toMatch(/^%PDF-1\.4/);
    expect(pdfText).toContain('/Type /Page');
    expect(pdfText).toContain('startxref');
  });

  it('persists an employee signature and completes an owner-signed contract', async () => {
    const signed = await fetch(
      'http://localhost/api/v1/stores/1/contracts/1/sign/employee',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: 'demo-signature' }),
      }
    );

    expect(signed.status).toBe(200);

    const fetched = await fetch('http://localhost/api/v1/stores/1/contracts/1');
    const body = (await fetched.json()) as {
      data: { employeeSigned: boolean; status: string };
    };

    expect(body.data).toMatchObject({
      employeeSigned: true,
      status: 'COMPLETED',
    });
  });
});
