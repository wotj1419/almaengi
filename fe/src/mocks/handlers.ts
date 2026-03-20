import { http, HttpResponse } from 'msw';
import type {
  AuctionBiddersDto,
  AuctionDto,
  BidAuctionRequest,
  CloseAuctionResponse,
  CreateAuctionRequest,
} from '@/api/auction.types';
import type { SignupRequest, LoginRequest } from '@/api/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const MOCK_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOCK_PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,72}$/;

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

// ─── Mock 매장 데이터 ───
interface MockStore {
  storeId: number;
  ownerId: number;
  storeName: string;
  address: string;
  phone: string | null;
  qrCode: string;
  isOver5Employees: boolean;
  isClosed: boolean;
}

// TODO(dev-mock): 매장등록 페이지 구현 시 제거
// TODO(dev-mock): 내 매장 조회 API 완전 연동 시 제거
const DEV_MOCK_STORES_KEY = 'devMockStores';
const IS_DEV_MOCK_STORE_PERSISTENCE_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true';

function isMockStore(value: unknown): value is MockStore {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.storeId === 'number' &&
    typeof candidate.ownerId === 'number' &&
    typeof candidate.storeName === 'string' &&
    typeof candidate.address === 'string' &&
    (typeof candidate.phone === 'string' || candidate.phone === null) &&
    typeof candidate.qrCode === 'string' &&
    typeof candidate.isOver5Employees === 'boolean' &&
    typeof candidate.isClosed === 'boolean'
  );
}

function readDevMockStores(): MockStore[] {
  if (
    !IS_DEV_MOCK_STORE_PERSISTENCE_ENABLED ||
    typeof window === 'undefined'
  ) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(DEV_MOCK_STORES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isMockStore);
  } catch {
    return [];
  }
}

function persistDevMockStores(stores: MockStore[]) {
  if (
    !IS_DEV_MOCK_STORE_PERSISTENCE_ENABLED ||
    typeof window === 'undefined'
  ) {
    return;
  }

  try {
    window.localStorage.setItem(DEV_MOCK_STORES_KEY, JSON.stringify(stores));
  } catch {
    // Ignore localStorage failures in development mock mode.
  }
}

const devMockStores: MockStore[] = readDevMockStores();
let nextStoreId =
  devMockStores.reduce((maxId, store) => Math.max(maxId, store.storeId), 0) + 1;

// ─── Mock 인증 상태 ───
const tokenToUserId = new Map<string, number>();
const refreshTokenToUserId = new Map<string, number>();
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

function issueAccessToken(userId: number) {
  const token = `mock-jwt-access-token-${userId}`;
  tokenToUserId.set(token, userId);
  return token;
}

function issueRefreshToken(userId: number) {
  const refreshToken = `mock-jwt-refresh-token-${userId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  refreshTokenToUserId.set(refreshToken, userId);
  return refreshToken;
}

function extractCookieValue(request: Request, cookieName: string) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith(`${cookieName}=`));

  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(cookieName.length + 1));
}

function buildRefreshTokenCookie(refreshToken: string) {
  return `${REFRESH_TOKEN_COOKIE_NAME}=${encodeURIComponent(refreshToken)}; Path=/api/v1/auth; SameSite=Strict`;
}

function buildClearRefreshTokenCookie() {
  return `${REFRESH_TOKEN_COOKIE_NAME}=; Path=/api/v1/auth; Max-Age=0; SameSite=Strict`;
}

function getAuthUser(request: Request) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);
  const userId = tokenToUserId.get(token);
  if (!userId) return null;

  return (
    mockUsers.find((user) => user.userId === userId && !user.isWithdraw) ?? null
  );
}

function toStoreInfo(store: MockStore) {
  return {
    storeId: store.storeId,
    storeName: store.storeName,
    address: store.address,
    phone: store.phone,
    qrCode: store.qrCode,
    isOver5Employees: store.isOver5Employees,
  };
}

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

function unauthorized(
  message: string = '유효하지 않은 토큰입니다.',
  status: string = 'A105'
) {
  return HttpResponse.json(
    {
      status,
      message,
      data: null,
    },
    { status: 401 }
  );
}

function forbidden(message: string, status: string = 'U003') {
  return HttpResponse.json(
    {
      status,
      message,
      data: null,
    },
    { status: 403 }
  );
}

export const handlers = [
  // ─── Auth 핸들러 ───

  // 회원가입 (POST /api/v1/auth/signup)
  http.post(`${BASE_URL}/api/v1/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as SignupRequest;
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';
    const name = (body.name ?? '').trim();
    const role = body.role;
    const phone = body.phone?.trim() ?? '';

    if (!email) {
      return badRequest('이메일은 필수입니다.', 'G002');
    }
    if (!MOCK_EMAIL_REGEX.test(email)) {
      return badRequest('올바른 이메일 형식이 아닙니다.', 'G002');
    }
    if (!password) {
      return badRequest('비밀번호는 필수입니다.', 'G002');
    }
    if (!MOCK_PASSWORD_REGEX.test(password)) {
      return badRequest(
        '비밀번호는 8자 이상 72자 이하, 영문/숫자/특수문자를 포함해야 합니다.',
        'G002'
      );
    }
    if (!name) {
      return badRequest('이름은 필수입니다.', 'G002');
    }
    if (!role) {
      return badRequest('역할은 필수입니다.', 'G002');
    }
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        return badRequest('휴대폰 번호 형식이 올바르지 않습니다.', 'G002');
      }
    }

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
      password,
      name,
      phone: phone || undefined,
      role,
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

    const refreshToken = issueRefreshToken(user.userId);

    return HttpResponse.json(
      {
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        accessToken: issueAccessToken(user.userId),
      },
    }, {
      headers: {
        'Set-Cookie': buildRefreshTokenCookie(refreshToken),
      },
    });
  }),

  // 이메일 중복 확인 (GET /api/v1/auth/check-email?email=)
  http.get(`${BASE_URL}/api/v1/auth/check-email`, ({ request }) => {
    const url = new URL(request.url);
    const email = (url.searchParams.get('email') || '').toLowerCase();
    const exists = mockUsers.some((u) => u.email === email && !u.isWithdraw);

    return HttpResponse.json(
      {
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: { exists },
    });
  }),

  // 토큰 재발급 (POST /api/v1/auth/reissue)
  http.post(`${BASE_URL}/api/v1/auth/reissue`, ({ request }) => {
    const refreshToken = extractCookieValue(request, REFRESH_TOKEN_COOKIE_NAME);
    if (!refreshToken) {
      return unauthorized('리프레시 토큰이 없습니다.', 'A106');
    }

    const userId = refreshTokenToUserId.get(refreshToken);
    if (!userId) {
      return unauthorized('리프레시 토큰이 일치하지 않습니다.', 'A107');
    }

    refreshTokenToUserId.delete(refreshToken);
    const reissuedToken = issueAccessToken(userId);
    const nextRefreshToken = issueRefreshToken(userId);
    return HttpResponse.json(
      {
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
      data: { accessToken: reissuedToken },
    }, {
      headers: {
        'Set-Cookie': buildRefreshTokenCookie(nextRefreshToken),
      },
    });
  }),

  // 로그아웃 (POST /api/v1/auth/logout)
  http.post(`${BASE_URL}/api/v1/auth/logout`, ({ request }) => {
    const authorization = request.headers.get('Authorization') || '';
    if (!authorization.startsWith('Bearer ')) {
      return unauthorized();
    }
    const token = authorization.slice(7);
    if (!tokenToUserId.has(token)) {
      return unauthorized();
    }
    tokenToUserId.delete(token);
    const refreshToken = extractCookieValue(request, REFRESH_TOKEN_COOKIE_NAME);
    if (refreshToken) {
      refreshTokenToUserId.delete(refreshToken);
    }

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
        data: null,
      },
      {
        headers: {
          'Set-Cookie': buildClearRefreshTokenCookie(),
        },
      }
    );
  }),

  // 회원 탈퇴 (DELETE /api/v1/auth/withdraw)
  http.delete(`${BASE_URL}/api/v1/auth/withdraw`, ({ request }) => {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorized();
    }
    user.isWithdraw = true;
    const refreshToken = extractCookieValue(request, REFRESH_TOKEN_COOKIE_NAME);
    if (refreshToken) {
      refreshTokenToUserId.delete(refreshToken);
    }

    return HttpResponse.json({
      status: 'SUCCESS',
      message: '요청이 성공적으로 처리되었습니다.',
        data: null,
      },
      {
        headers: {
          'Set-Cookie': buildClearRefreshTokenCookie(),
        },
      }
    );
  }),

  // 내 매장 목록 조회 (GET /api/v1/stores)
  http.get(`${BASE_URL}/api/v1/stores`, ({ request }) => {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorized();
    }

    const stores = devMockStores
      .filter((store) => store.ownerId === user.userId && !store.isClosed)
      .map(toStoreInfo);

    return success(stores);
  }),

  // 매장 등록 (POST /api/v1/stores)
  http.post(`${BASE_URL}/api/v1/stores`, async ({ request }) => {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorized();
    }
    if (user.role !== 'OWNER') {
      return forbidden('요청 권한이 없는 역할입니다.', 'U003');
    }

    const body = (await request.json()) as {
      storeName: string;
      address: string;
      phone?: string | null;
      isOver5Employees?: boolean;
    };

    const newStore: MockStore = {
      storeId: nextStoreId++,
      ownerId: user.userId,
      storeName: body.storeName,
      address: body.address,
      phone: body.phone ?? null,
      qrCode: `mock-qr-${Date.now()}`,
      isOver5Employees: body.isOver5Employees ?? false,
      isClosed: false,
    };
    devMockStores.push(newStore);
    persistDevMockStores(devMockStores);

    return success(toStoreInfo(newStore));
  }),

  // 매장 단건 조회 (GET /api/v1/stores/:storeId)
  http.get(`${BASE_URL}/api/v1/stores/:storeId`, ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorized();
    }

    const storeId = Number(params.storeId);
    const store = devMockStores.find(
      (target) => target.storeId === storeId && !target.isClosed
    );
    if (!store) {
      return notFound('해당 매장을 찾을 수 없습니다.', 'S001');
    }
    if (store.ownerId !== user.userId) {
      return forbidden('요청 권한이 없는 유저입니다.', 'U004');
    }

    return success(toStoreInfo(store));
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
    `${BASE_URL}/api/v1/auctions/:auctionId/bids`,
    async ({ request, params }) => {
      const user = getAuthUser(request);
      if (!user) {
        return unauthorized();
      }
      if (user.role !== 'EMPLOYEE') {
        return forbidden('요청 권한이 없는 역할입니다.', 'U003');
      }

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

      // NOTE(dev-mock): real backend also validates store-employee membership.
      // For current mock-based owner UI verification, membership validation is skipped.
      const bidders = getOrCreateBidders(auctionId);
      const allBidders = [...bidders.group1, ...bidders.group2, ...bidders.group3];
      const existingBidder = allBidders.find(
        (bidder) => bidder.employeeId === user.userId
      );

      if (existingBidder) {
        existingBidder.proposedWage = body.bidWage;
        existingBidder.bidTime = new Date().toISOString();
      } else {
        bidders.group3.push({
          bidId: nextBidId++,
          employeeId: user.userId,
          applicantName: user.name,
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
