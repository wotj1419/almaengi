import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';

import { createSeedDemoData } from '../data';
import { handlers } from '../handlers';
import { readDemoData, resetDemoData, writeDemoData } from '../storage';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

afterEach(() => {
  resetDemoData();
  localStorage.removeItem('almaengi:portfolio-demo:v1');
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
  it('adds a newly introduced contract request to existing saved data', () => {
    const existing = structuredClone(createSeedDemoData());
    existing.contracts = existing.contracts.filter(
      (contract) => contract.contractId !== 2
    );
    existing.nextIds.contract = 2;
    writeDemoData(existing);

    const migrated = readDemoData();

    expect(
      migrated.contracts.find((contract) => contract.contractId === 2)
    ).toMatchObject({
      contractId: 2,
      status: 'OWNER_SIGNED',
    });
    expect(migrated.nextIds.contract).toBe(3);
  });
  it('updates the additional contract name in existing saved data', () => {
    const existing = structuredClone(createSeedDemoData());
    const request = existing.contracts.find(
      (contract) => contract.contractId === 2
    );
    expect(request).toBeDefined();
    if (!request) throw new Error('contract request 2 is required');
    request.employeeName = '데모 직원';
    writeDemoData(existing);

    const migrated = readDemoData();
    expect(
      migrated.contracts.find((contract) => contract.contractId === 2)
    ).toMatchObject({ employeeName: '이서연' });
  });

  it('starts a new signature flow instead of restoring a completed prior demo', () => {
    const completed = structuredClone(createSeedDemoData());
    const request = completed.contracts.find(
      (contract) => contract.contractId === 2
    );

    expect(request).toBeDefined();
    if (!request) throw new Error('contract request 2 is required');

    request.status = 'COMPLETED';
    request.employeeSigned = true;
    request.employeeSignedAt = '2026-09-01T11:00:00';
    localStorage.setItem(
      'almaengi:portfolio-demo:v1',
      JSON.stringify(completed)
    );

    const reset = readDemoData();
    expect(
      reset.contracts.find((contract) => contract.contractId === 2)
    ).toMatchObject({
      status: 'OWNER_SIGNED',
      employeeSigned: false,
      employeeSignedAt: null,
    });
  });
});

describe('demo document handlers', () => {
  it('returns a standard contract PDF without demo labels', async () => {
    const response = await fetch(
      'http://localhost/api/v1/stores/1/contracts/1/pdf'
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
    const pdfText = await response.text();

    expect(pdfText).toMatch(/^%PDF-1\.4/);
    expect(pdfText).toContain('Standard Employment Contract');
    expect(pdfText).not.toContain('DEMO DOCUMENT');
    expect(pdfText).not.toContain('Demonstration agreement');
  });
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

  it('includes an additional contract request that an employee can complete', async () => {
    const listed = await fetch('http://localhost/api/v1/stores/1/contracts/me');

    expect(listed.status).toBe(200);
    const body = (await listed.json()) as {
      data: Array<Record<string, unknown>>;
    };
    const request = body.data.find((contract) => contract.contractId === 2);

    expect(request).toMatchObject({
      contractId: 2,
      status: 'OWNER_SIGNED',
      employeeName: '이서연',
    });

    const signed = await fetch(
      'http://localhost/api/v1/stores/1/contracts/2/sign/employee',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: 'demo-signature' }),
      }
    );

    expect(signed.status).toBe(200);
    const signedBody = (await signed.json()) as {
      data: { employeeSigned: boolean; status: string };
    };
    expect(signedBody.data).toMatchObject({
      employeeSigned: true,
      status: 'COMPLETED',
    });

    const pdf = await fetch('http://localhost/api/v1/stores/1/contracts/2/pdf');
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get('content-type')).toContain('application/pdf');
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
