import { afterEach, describe, expect, it } from 'vitest';

import { readDemoData, resetDemoData, writeDemoData } from '../storage';

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
