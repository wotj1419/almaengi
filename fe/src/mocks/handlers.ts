import { http, HttpResponse } from 'msw';
import type { AuctionDto, CreateAuctionRequest } from '@/api/auction.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// ─── Mock 데이터 ───
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
  // 로그인
  http.post(`${BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json({
      accessToken: 'mock-jwt-token',
      user: { id: 1, name: '홍길동', role: 'OWNER' },
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
