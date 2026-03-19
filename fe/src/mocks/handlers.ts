import { http, HttpResponse } from 'msw';
import type {
  AuctionBiddersDto,
  AuctionDto,
  CloseAuctionResponse,
  CreateAuctionRequest,
} from '@/api/auction.types';
import type { SignupRequest, LoginRequest } from '@/api/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// ─── Mock 유저 데이터 ───
let nextUserId = 3;

interface MockUser {
  userId: number;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'OWNER' | 'EMPLOYEE';
  isWithdraw: boolean;
}

const mockUsers: MockUser[] = [
  {
    userId: 1,
    email: 'owner@test.com',
    password: 'Test1234!',
    name: '김사장',
    role: 'OWNER',
    isWithdraw: false,
  },
  {
    userId: 2,
    email: 'employee@test.com',
    password: 'Test1234!',
    name: '박알바',
    role: 'EMPLOYEE',
    isWithdraw: false,
  },
];

// ─── Mock 경매 데이터 ───
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
  // ─── Auth 핸들러 ───

  // 회원가입 (POST /api/v1/auth/signup)
  http.post(`${BASE_URL}/api/v1/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as SignupRequest;
    const email = body.email.toLowerCase();

    const exists = mockUsers.some((u) => u.email === email);
    if (exists) {
      return HttpResponse.json(
        {
          status: 'U002',
          message: '이미 존재하는 이메일입니다.',
          data: null,
        },
        { status: 409 }
      );
    }

    const newUser: MockUser = {
      userId: nextUserId++,
      email,
      password: body.password,
      name: body.name,
      phone: body.phone,
      role: body.role,
      isWithdraw: false,
    };
    mockUsers.push(newUser);

    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: '요청이 성공적으로 처리되었습니다.',
        data: {
          userId: newUser.userId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  }),

  // 로그인 (POST /api/v1/auth/login)
  http.post(`${BASE_URL}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    const email = body.email.toLowerCase();

    const user = mockUsers.find((u) => u.email === email);

    if (!user || user.password !== body.password) {
      return HttpResponse.json(
        {
          status: 'A101',
          message: '이메일 또는 비밀번호가 올바르지 않습니다.',
          data: null,
        },
        { status: 401 }
      );
    }

    if (user.isWithdraw) {
      return HttpResponse.json(
        {
          status: 'A102',
          message: '탈퇴한 사용자입니다.',
          data: null,
        },
        { status: 403 }
      );
    }

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        // storeId: 경매 API에서 매장 식별에 사용
        storeId: 1,
        accessToken: 'mock-jwt-access-token',
      },
    });
  }),

  // 이메일 중복 확인 (GET /api/v1/auth/check-email?email=)
  http.get(`${BASE_URL}/api/v1/auth/check-email`, ({ request }) => {
    const url = new URL(request.url);
    const email = (url.searchParams.get('email') || '').toLowerCase();
    const exists = mockUsers.some((u) => u.email === email && !u.isWithdraw);

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: { exists },
    });
  }),

  // 토큰 재발급 (POST /api/v1/auth/reissue)
  http.post(`${BASE_URL}/api/v1/auth/reissue`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: { accessToken: 'mock-jwt-access-token-reissued' },
    });
  }),

  // 로그아웃 (POST /api/v1/auth/logout)
  http.post(`${BASE_URL}/api/v1/auth/logout`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: null,
    });
  }),

  // 회원 탈퇴 (DELETE /api/v1/auth/withdraw)
  http.delete(`${BASE_URL}/api/v1/auth/withdraw`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: null,
    });
  }),

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
