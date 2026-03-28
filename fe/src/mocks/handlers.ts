import { http, HttpResponse } from 'msw';
import type {
  AuctionBiddersDto,
  AuctionDto,
  BidAuctionRequest,
  CloseAuctionResponse,
  CreateAuctionRequest,
} from '@/api/auction.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

let nextAuctionId = 4;

let mockAuctions: AuctionDto[] = [
  {
    auctionId: 1,
    storeId: 1,
    targetDate: '2026-03-22',
    targetStartTime: '10:00:00',
    targetEndTime: '14:00:00',
    deadline: '2026-03-21T18:00:00',
    minWage: 10320,
    maxWage: 12500,
    recruitCount: 2,
    status: 'IN_PROGRESS',
    winnerIds: [],
    createdAt: '2026-03-19T09:00:00',
  },
  {
    auctionId: 2,
    storeId: 1,
    targetDate: '2026-03-18',
    targetStartTime: '17:00:00',
    targetEndTime: '22:00:00',
    deadline: '2026-03-17T18:00:00',
    minWage: 10320,
    maxWage: 14000,
    recruitCount: 2,
    status: 'CLOSED',
    winnerIds: [10, 11],
    createdAt: '2026-03-15T11:30:00',
  },
  {
    auctionId: 3,
    storeId: 1,
    targetDate: '2026-03-20',
    targetStartTime: '09:00:00',
    targetEndTime: '12:00:00',
    deadline: '2026-03-19T12:00:00',
    minWage: 10320,
    maxWage: 11800,
    recruitCount: 1,
    status: 'CANCELLED',
    winnerIds: [],
    createdAt: '2026-03-16T10:00:00',
  },
];

const mockBiddersByAuction: Record<number, AuctionBiddersDto | null> = {
  1: {
    group1: [
      {
        bidId: 101,
        employeeId: 10,
        applicantName: 'Park',
        proposedWage: 11000,
        tags: ['Reliable', '2 months'],
        bidTime: '2026-03-20T14:30:00',
      },
    ],
    group2: [
      {
        bidId: 102,
        employeeId: 11,
        applicantName: 'Kim',
        proposedWage: 11500,
        tags: ['New'],
        bidTime: '2026-03-20T15:00:00',
      },
    ],
    group3: [
      {
        bidId: 103,
        employeeId: 12,
        applicantName: 'Choi',
        proposedWage: 12500,
        tags: ['Overtime risk'],
        bidTime: '2026-03-20T15:10:00',
      },
    ],
  },
  2: {
    group1: [
      {
        bidId: 201,
        employeeId: 10,
        applicantName: 'Park',
        proposedWage: 12000,
        tags: ['Winner'],
        bidTime: '2026-03-16T12:00:00',
      },
      {
        bidId: 202,
        employeeId: 11,
        applicantName: 'Kim',
        proposedWage: 12600,
        tags: ['Winner'],
        bidTime: '2026-03-16T12:10:00',
      },
    ],
    group2: [
      {
        bidId: 203,
        employeeId: 12,
        applicantName: 'Choi',
        proposedWage: 13500,
        tags: ['Backup'],
        bidTime: '2026-03-16T12:20:00',
      },
    ],
    group3: [],
  },
  3: null,
};

let nextBidId =
  Object.values(mockBiddersByAuction)
    .flatMap((bidders) =>
      bidders ? [...bidders.group1, ...bidders.group2, ...bidders.group3] : []
    )
    .reduce((maxId, bidder) => Math.max(maxId, bidder.bidId), 0) + 1;

function getOrCreateBidders(auctionId: number): AuctionBiddersDto {
  const bidders = mockBiddersByAuction[auctionId];
  if (bidders) {
    return bidders;
  }

  const emptyBidders: AuctionBiddersDto = {
    group1: [],
    group2: [],
    group3: [],
  };
  mockBiddersByAuction[auctionId] = emptyBidders;
  return emptyBidders;
}

function extractMockUserId(request: Request): number | null {
  const authorization = request.headers.get('Authorization') || '';
  const match = authorization.match(/Bearer mock-jwt-access-token-(\d+)$/);
  if (!match) return null;
  return Number(match[1]);
}

function success<T>(data: T) {
  return HttpResponse.json({
    status: 'SUCCESS',
    message: 'Request completed successfully.',
    data,
  });
}

function notFound(message: string, status: string) {
  return HttpResponse.json(
    {
      status,
      message,
      data: null,
    },
    { status: 404 }
  );
}

function badRequest(message: string, status: string) {
  return HttpResponse.json(
    {
      status,
      message,
      data: null,
    },
    { status: 400 }
  );
}

export const handlers = [
  http.get(`${BASE_URL}/api/v1/auctions/store/:storeId`, ({ params }) => {
    const storeId = Number(params.storeId);
    const auctions = mockAuctions.filter(
      (auction) => auction.storeId === storeId
    );

    return success(auctions);
  }),

  http.get(`${BASE_URL}/api/v1/auctions/:auctionId`, ({ params }) => {
    const auctionId = Number(params.auctionId);
    const auction = mockAuctions.find((item) => item.auctionId === auctionId);

    if (!auction) {
      return notFound('Auction not found.', 'A001');
    }

    return success({
      auction,
      bidders: mockBiddersByAuction[auctionId] ?? null,
    });
  }),

  http.post(
    `${BASE_URL}/api/v1/auctions/:auctionId/bids`,
    async ({ request, params }) => {
      const auctionId = Number(params.auctionId);
      const auction = mockAuctions.find((item) => item.auctionId === auctionId);
      if (!auction) {
        return notFound('Auction not found.', 'A001');
      }
      if (auction.status !== 'IN_PROGRESS') {
        return badRequest('Auction is not in progress.', 'A002');
      }

      const body = (await request.json()) as BidAuctionRequest;
      if (typeof body.bidWage !== 'number') {
        return badRequest('Bid wage is required.', 'A004');
      }
      if (body.bidWage < auction.minWage || body.bidWage > auction.maxWage) {
        return badRequest('Bid wage is out of range.', 'A004');
      }

      const employeeId = extractMockUserId(request) ?? 999;
      const applicantName =
        employeeId === 999 ? 'Mock Employee' : `User ${employeeId}`;
      const bidders = getOrCreateBidders(auctionId);
      const allBidders = [
        ...bidders.group1,
        ...bidders.group2,
        ...bidders.group3,
      ];
      const existingBidder = allBidders.find(
        (bidder) => bidder.employeeId === employeeId
      );

      if (existingBidder) {
        existingBidder.proposedWage = body.bidWage;
        existingBidder.bidTime = new Date().toISOString();
      } else {
        bidders.group3.push({
          bidId: nextBidId++,
          employeeId,
          applicantName,
          proposedWage: body.bidWage,
          tags: ['Mock bidder'],
          bidTime: new Date().toISOString(),
        });
      }

      return success(null);
    }
  ),

  http.post(
    `${BASE_URL}/api/v1/auctions/store/:storeId`,
    async ({ request, params }) => {
      const body = (await request.json()) as CreateAuctionRequest;
      const storeId = Number(params.storeId);
      const deadline = new Date(body.deadline);

      if (deadline.getTime() <= Date.now()) {
        return badRequest('Deadline must be in the future.', 'A011');
      }

      const newAuction: AuctionDto = {
        auctionId: nextAuctionId++,
        storeId,
        targetDate: body.targetDate,
        targetStartTime: body.targetStartTime,
        targetEndTime: body.targetEndTime,
        deadline: body.deadline,
        minWage: body.minWage,
        maxWage: body.maxWage,
        recruitCount: body.recruitCount,
        status: 'IN_PROGRESS',
        winnerIds: [],
        createdAt: new Date().toISOString(),
      };

      mockAuctions = [newAuction, ...mockAuctions];
      mockBiddersByAuction[newAuction.auctionId] = {
        group1: [],
        group2: [],
        group3: [],
      };

      return success(null);
    }
  ),

  http.put(
    `${BASE_URL}/api/v1/auctions/:auctionId`,
    async ({ request, params }) => {
      const auctionId = Number(params.auctionId);
      const body = (await request.json()) as CreateAuctionRequest;
      const index = mockAuctions.findIndex(
        (item) => item.auctionId === auctionId
      );

      if (index === -1) {
        return notFound('Auction not found.', 'A001');
      }

      if (mockAuctions[index].status !== 'IN_PROGRESS') {
        return badRequest('Auction is not in progress.', 'A002');
      }

      mockAuctions[index] = {
        ...mockAuctions[index],
        ...body,
      };

      return success(null);
    }
  ),

  http.delete(`${BASE_URL}/api/v1/auctions/:auctionId`, ({ params }) => {
    const auctionId = Number(params.auctionId);
    const index = mockAuctions.findIndex(
      (item) => item.auctionId === auctionId
    );

    if (index === -1) {
      return notFound('Auction not found.', 'A001');
    }

    if (mockAuctions[index].status !== 'IN_PROGRESS') {
      return badRequest('Auction is not in progress.', 'A002');
    }

    mockAuctions[index] = {
      ...mockAuctions[index],
      status: 'CANCELLED',
      winnerIds: [],
    };

    return success(null);
  }),

  http.post(
    `${BASE_URL}/api/v1/auctions/:auctionId/close`,
    async ({ request, params }) => {
      const auctionId = Number(params.auctionId);
      const auction = mockAuctions.find((item) => item.auctionId === auctionId);

      if (!auction) {
        return notFound('Auction not found.', 'A001');
      }

      if (auction.status !== 'IN_PROGRESS') {
        return badRequest('Auction is not in progress.', 'A002');
      }

      const body = (await request.json()) as { selectedBidIds: number[] };

      if (body.selectedBidIds.length === 0) {
        return badRequest('Please select at least one bidder.', 'A006');
      }

      if (body.selectedBidIds.length > auction.recruitCount) {
        return badRequest('Selected bidders exceed recruit count.', 'A007');
      }

      const bidders = mockBiddersByAuction[auctionId];
      const allBidders = bidders
        ? [...bidders.group1, ...bidders.group2, ...bidders.group3]
        : [];
      const selectedBidders = allBidders.filter((bidder) =>
        body.selectedBidIds.includes(bidder.bidId)
      );

      if (selectedBidders.length !== body.selectedBidIds.length) {
        return badRequest('Invalid bid selection.', 'A007');
      }

      const response: CloseAuctionResponse = {
        auctionId,
        status: 'CLOSED',
        winners: selectedBidders.map((bidder) => ({
          bidId: bidder.bidId,
          employeeId: bidder.employeeId,
          employeeName: bidder.applicantName,
          bidWage: bidder.proposedWage,
        })),
      };

      auction.status = 'CLOSED';
      auction.winnerIds = response.winners.map((winner) => winner.employeeId);

      return success(response);
    }
  ),
];
