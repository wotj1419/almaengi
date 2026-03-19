import { http, HttpResponse } from 'msw';
import type { AuctionDto, CreateAuctionRequest } from '@/api/auction.types';
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
let nextId = 3;

let mockAuctions: AuctionDto[] = [
  {
    auctionId: 1,
    storeId: 1,
    targetDate: '2026-03-12',
    targetStartTime: '10:00:00',
    targetEndTime: '14:00:00',
    deadline: '2026-03-11T18:00:00',
    minWage: 10320,
    maxWage: 12500,
    recruitCount: 2,
    status: 'IN_PROGRESS',
    winnerIds: [],
  },
  {
    auctionId: 2,
    storeId: 1,
    targetDate: '2026-03-12',
    targetStartTime: '10:00:00',
    targetEndTime: '14:00:00',
    deadline: '2026-03-11T18:00:00',
    minWage: 10320,
    maxWage: 12500,
    recruitCount: 2,
    status: 'CLOSED',
    winnerIds: [10, 11],
  },
];

const mockBidders = {
  group1: [
    {
      bidId: 101,
      employeeId: 10,
      applicantName: '박알바',
      proposedWage: 11000,
      tags: ['우수', '근속 2년', '결근 0회'],
      bidTime: '2026-03-10T14:30:00',
    },
  ],
  group2: [
    {
      bidId: 102,
      employeeId: 11,
      applicantName: '김알바',
      proposedWage: 11500,
      tags: ['신규'],
      bidTime: '2026-03-10T15:00:00',
    },
  ],
  group3: [
    {
      bidId: 103,
      employeeId: 12,
      applicantName: '고알바',
      proposedWage: 12500,
      tags: ['주휴수당 발생 중'],
      bidTime: '2026-03-10T14:30:00',
    },
  ],
};

// ─── 핸들러 ───
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

  // 경매 목록 조회
  http.get(`${BASE_URL}/api/v1/auctions/store/:storeId`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: mockAuctions,
    });
  }),

  // 경매 상세 조회
  http.get(`${BASE_URL}/api/v1/auctions/:auctionId`, ({ params }) => {
    const auctionId = Number(params.auctionId);
    const auction = mockAuctions.find((a) => a.auctionId === auctionId);

    if (!auction) {
      return HttpResponse.json(
        {
          status: 'A001',
          message: '해당 구인 경매를 찾을 수 없습니다.',
          data: null,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: {
        auction,
        bidders: mockBidders,
      },
    });
  }),

  // 경매 등록
  http.post(
    `${BASE_URL}/api/v1/auctions/store/:storeId`,
    async ({ request, params }) => {
      const body = (await request.json()) as CreateAuctionRequest;
      const storeId = Number(params.storeId);

      const newAuction: AuctionDto = {
        auctionId: nextId++,
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
      };
      mockAuctions.push(newAuction);

      return HttpResponse.json({
        status: 'SUCCESS',
        message: '요청이 성공적으로 처리되었습니다.',
        data: null,
      });
    }
  ),

  // 경매 수정
  http.put(
    `${BASE_URL}/api/v1/auctions/:auctionId`,
    async ({ request, params }) => {
      const auctionId = Number(params.auctionId);
      const body = (await request.json()) as CreateAuctionRequest;
      const index = mockAuctions.findIndex((a) => a.auctionId === auctionId);

      if (index === -1) {
        return HttpResponse.json(
          {
            status: 'A001',
            message: '해당 구인 경매를 찾을 수 없습니다.',
            data: null,
          },
          { status: 404 }
        );
      }

      mockAuctions[index] = { ...mockAuctions[index], ...body };

      return HttpResponse.json({
        status: 'SUCCESS',
        message: '요청이 성공적으로 처리되었습니다.',
        data: null,
      });
    }
  ),

  // 경매 중단 (삭제)
  http.delete(`${BASE_URL}/api/v1/auctions/:auctionId`, ({ params }) => {
    const auctionId = Number(params.auctionId);
    mockAuctions = mockAuctions.filter((a) => a.auctionId !== auctionId);

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: null,
    });
  }),

  // 경매 낙찰
  http.post(
    `${BASE_URL}/api/v1/auctions/:auctionId/close`,
    async ({ request, params }) => {
      const auctionId = Number(params.auctionId);
      const auction = mockAuctions.find((a) => a.auctionId === auctionId);

      if (!auction) {
        return HttpResponse.json(
          {
            status: 'A001',
            message: '해당 구인 경매를 찾을 수 없습니다.',
            data: null,
          },
          { status: 404 }
        );
      }

      const body = (await request.json()) as { selectedBidIds: number[] };
      const allBidders = [
        ...mockBidders.group1,
        ...mockBidders.group2,
        ...mockBidders.group3,
      ];
      const selectedEmployeeIds = allBidders
        .filter((b) => body.selectedBidIds.includes(b.bidId))
        .map((b) => b.employeeId);

      auction.status = 'CLOSED';
      auction.winnerIds = selectedEmployeeIds;

      return HttpResponse.json({
        status: 'SUCCESS',
        message: '요청이 성공적으로 처리되었습니다.',
        data: null,
      });
    }
  ),
];
