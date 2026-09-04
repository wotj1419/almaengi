import type { AttendanceResult, MyAttendanceLog } from '@/api/attendance';
import type { ContractDetail } from '@/api/contract';
import type {
  AuctionBiddersDto,
  AuctionDto,
  AuctionInsightsReportDto,
} from '@/api/auction.types';
import type { MessageItem, RoomDetail } from '@/api/chat';
import type { NotificationItem } from '@/api/notification.types';
import type { PayrollDetailViewResponse, PayrollSummary } from '@/api/payroll';
import type { StorePayrollSummary } from '@/features/payroll/types';
import type { MonthlyAttendanceReport } from '@/api/attendance';
import type { ScheduleDto } from '@/api/schedule';
import type { Employee, StoreInfo } from '@/api/store';

export interface DemoAttendance extends MyAttendanceLog {
  attendanceId: number;
}

export interface DemoData {
  stores: StoreInfo[];
  employees: Employee[];
  schedules: ScheduleDto[];
  attendances: DemoAttendance[];
  payrolls: StorePayrollSummary;
  contracts: ContractDetail[];
  auctions: AuctionDto[];
  biddersByAuction: Record<number, AuctionBiddersDto>;
  rooms: RoomDetail[];
  messagesByRoom: Record<number, MessageItem[]>;
  lastReadMessageIdByRoom: Record<number, number>;
  notifications: NotificationItem[];
  nextIds: {
    schedule: number;
    attendance: number;
    auction: number;
    bid: number;
    room: number;
    contract: number;
    message: number;
  };
}

export const demoPayrollSummary: PayrollSummary = {
  targetMonth: '2026-09',
  isPartialMonth: false,
  thisMonthStart: '2026-09-01',
  thisMonthEnd: '2026-09-30',
  lastMonthStart: '2026-08-01',
  lastMonthEnd: '2026-08-31',
  thisMonthTotal: 3240000,
  lastMonthTotal: 3010000,
  changeRate: 7.6,
  changeDirection: 'UP',
  thisMonthBasicPay: 2890000,
  lastMonthBasicPay: 2720000,
  thisMonthWeeklyHolidayPay: 220000,
  lastMonthWeeklyHolidayPay: 190000,
  thisMonthOvertimePay: 130000,
  lastMonthOvertimePay: 100000,
  thisMonthNightPay: 0,
  lastMonthNightPay: 0,
  employeeCount: 3,
  employees: [
    { employeeId: 10, employeeName: '데모 직원', netPay: 1140000 },
    { employeeId: 11, employeeName: '김하늘', netPay: 1080000 },
    { employeeId: 12, employeeName: '박도윤', netPay: 1020000 },
  ],
  topEarners: [
    { employeeId: 10, employeeName: '데모 직원', netPay: 1140000 },
    { employeeId: 11, employeeName: '김하늘', netPay: 1080000 },
  ],
};

export const demoStorePayrolls: StorePayrollSummary = {
  targetMonth: '2026-09',
  totalLaborCost: 3240000,
  totalGrossPay: 3360000,
  totalDeduction: 120000,
  employeeCount: 3,
  employees: [
    {
      payrollId: 1,
      employeeId: 10,
      employeeName: '데모 직원',
      position: '바리스타',
      totalWorkMinutes: 9000,
      basicPay: 1032000,
      totalAllowance: 140000,
      totalDeduction: 32000,
      netPay: 1140000,
      isApproved: true,
      isTransferred: false,
      transferredAt: null,
    },
    {
      payrollId: 2,
      employeeId: 11,
      employeeName: '김하늘',
      position: '캐셔',
      totalWorkMinutes: 8400,
      basicPay: 980000,
      totalAllowance: 130000,
      totalDeduction: 30000,
      netPay: 1080000,
      isApproved: true,
      isTransferred: false,
      transferredAt: null,
    },
    {
      payrollId: 3,
      employeeId: 12,
      employeeName: '박도윤',
      position: '주방',
      totalWorkMinutes: 7800,
      basicPay: 878000,
      totalAllowance: 120000,
      totalDeduction: 28000,
      netPay: 1020000,
      isApproved: false,
      isTransferred: false,
      transferredAt: null,
    },
  ],
};

export const demoPayrollDetails: Record<number, PayrollDetailViewResponse> = {
  1: {
    payrollId: 1,
    employeeName: '데모 직원',
    targetMonth: '2026-09',
    totalWorkMinutes: 9000,
    nightWorkMinutes: 0,
    basicPay: 1032000,
    totalAllowance: 140000,
    totalDeduction: 32000,
    netPay: 1140000,
    isApproved: true,
    baseItems: [
      {
        detailId: 1,
        detailType: 'BASE',
        itemName: '기본급',
        amount: 1032000,
        calculationFormula: '86시간 × 12,000원',
        workMinutes: 9000,
      },
    ],
    allowanceItems: [
      {
        detailId: 2,
        detailType: 'ALLOWANCE',
        itemName: '주휴수당',
        amount: 140000,
        calculationFormula: null,
        workMinutes: null,
      },
    ],
    deductionItems: [
      {
        detailId: 3,
        detailType: 'DEDUCTION',
        itemName: '원천징수',
        amount: 32000,
        calculationFormula: null,
        workMinutes: null,
      },
    ],
  },
};

export const demoContracts: ContractDetail[] = [
  {
    contractId: 1,
    storeEmployeeId: 10,
    employerName: '데모 점주',
    storeName: '알맹이 데모 카페',
    storeAddress: '서울시 중구 데모로 1',
    storePhone: '02-1234-5678',
    employeeName: '데모 직원',
    employeePhone: '010-1111-2222',
    employeeAddress: '서울시 중구 데모동 10',
    contractStartDate: '2026-01-02',
    contractEndDate: null,
    workplace: '알맹이 데모 카페',
    jobDescription: '음료 제조 및 매장 관리',
    workStartTime: '09:00',
    workEndTime: '15:00',
    breakStartTime: '12:00',
    breakEndTime: '12:30',
    workDaysPerWeek: 5,
    weeklyHoliday: '일요일',
    wageType: 'HOURLY',
    wageAmount: 12000,
    hasBonus: false,
    bonusAmount: null,
    hasOtherAllowance: false,
    otherAllowanceDetails: null,
    payDayDescription: '매월 25일',
    paymentMethod: '계좌이체',
    employmentInsurance: true,
    industrialAccidentInsurance: true,
    nationalPension: true,
    healthInsurance: true,
    contractDate: '2026-01-02',
    status: 'OWNER_SIGNED',
    ownerSigned: true,
    ownerSignedAt: '2026-01-02T09:00:00',
    employeeSigned: false,
    employeeSignedAt: null,
    createdAt: '2026-01-02T08:00:00',
  },
  {
    contractId: 2,
    storeEmployeeId: 10,
    employerName: '김도현',
    storeName: '알맹이 커피 성수점',
    storeAddress: '서울특별시 성동구 성수이로 00',
    storePhone: '02-463-5821',
    employeeName: '데모 직원',
    employeePhone: '010-1111-2222',
    employeeAddress: '서울특별시 중구 데모동 10',
    contractStartDate: '2026-09-08',
    contractEndDate: null,
    workplace: '알맹이 커피 성수점',
    jobDescription: '음료 제조 및 매장 관리',
    workStartTime: '12:00',
    workEndTime: '18:00',
    breakStartTime: '15:00',
    breakEndTime: '15:30',
    workDaysPerWeek: 4,
    weeklyHoliday: '일요일',
    wageType: 'HOURLY',
    wageAmount: 12500,
    hasBonus: false,
    bonusAmount: null,
    hasOtherAllowance: false,
    otherAllowanceDetails: null,
    payDayDescription: '매월 25일',
    paymentMethod: '계좌이체',
    employmentInsurance: true,
    industrialAccidentInsurance: true,
    nationalPension: true,
    healthInsurance: true,
    contractDate: '2026-09-01',
    status: 'OWNER_SIGNED',
    ownerSigned: true,
    ownerSignedAt: '2026-09-01T10:00:00',
    employeeSigned: false,
    employeeSignedAt: null,
    createdAt: '2026-09-01T09:00:00',
  },
];

export const demoAttendanceReport: MonthlyAttendanceReport = {
  targetMonth: '2026-09',
  employees: [
    {
      employeeId: 10,
      employeeName: '데모 직원',
      attendanceCount: 18,
      lateCount: 1,
      absentCount: 0,
      totalWorkMinutes: 8100,
    },
    {
      employeeId: 11,
      employeeName: '김하늘',
      attendanceCount: 19,
      lateCount: 0,
      absentCount: 0,
      totalWorkMinutes: 8400,
    },
    {
      employeeId: 12,
      employeeName: '박도윤',
      attendanceCount: 16,
      lateCount: 2,
      absentCount: 1,
      totalWorkMinutes: 7200,
    },
  ],
  diligentEmployees: [{ employeeId: 11, employeeName: '김하늘' }],
  lateChampions: [{ employeeId: 12, employeeName: '박도윤' }],
};

export const demoAuctionInsightsReport: AuctionInsightsReportDto = {
  yearMonth: '2026-09',
  totalAuctionCount: 2,
  closedAuctionCount: 1,
  successRate: 50,
  averageWinningWage: 12000,
  timelinePage: {
    content: [
      {
        dayOfWeek: 'MONDAY',
        startTime: '10:00:00',
        endTime: '14:00:00',
        auctionCount: 1,
      },
    ],
    page: 0,
    size: 6,
    totalElements: 1,
    totalPages: 1,
    hasNext: false,
  },
};
export const demoAttendanceResult = (
  attendance: DemoAttendance
): AttendanceResult => ({
  type: attendance.clockOut ? 'CLOCK_OUT' : 'CLOCK_IN',
  attendanceId: attendance.attendanceId,
  clockIn: attendance.clockIn,
  clockOut: attendance.clockOut,
  status: attendance.status ?? 'WORKING',
  overtime: attendance.overtime ?? false,
  scheduledEndTime: attendance.scheduledEndTime,
  message: attendance.clockOut
    ? '퇴근이 기록되었습니다.'
    : '출근이 기록되었습니다.',
});

export function createSeedDemoData(): DemoData {
  return {
    stores: [
      {
        storeId: 1,
        storeName: '알맹이 데모 카페',
        address: '서울시 중구 데모로 1',
        phone: '02-1234-5678',
        qrCode: 'demo-store-1',
        isOver5Employees: false,
      },
    ],
    employees: [
      {
        employeeId: 10,
        userId: 10,
        name: '데모 직원',
        phone: '010-1111-2222',
        position: '바리스타',
        hourlyWage: 12000,
        taxType: 'THREE_POINT_THREE',
        includeHolidayPay: true,
        hireDate: '2026-01-02',
        status: 'WORKING',
      },
      {
        employeeId: 11,
        userId: 11,
        name: '김하늘',
        phone: '010-2222-3333',
        position: '캐셔',
        hourlyWage: 11500,
        taxType: 'THREE_POINT_THREE',
        includeHolidayPay: true,
        hireDate: '2026-02-01',
        status: 'WORKING',
      },
      {
        employeeId: 12,
        userId: 12,
        name: '박도윤',
        phone: '010-3333-4444',
        position: '주방',
        hourlyWage: 13000,
        taxType: 'FOUR_INSURANCE',
        includeHolidayPay: false,
        hireDate: '2026-03-01',
        status: 'WAITING',
      },
    ],
    schedules: [
      {
        scheduleId: 1,
        employeeId: 10,
        employeeName: '데모 직원',
        dayOfWeek: 'MONDAY',
        startTime: '09:00:00',
        endTime: '15:00:00',
        breakMinutes: 30,
      },
      {
        scheduleId: 2,
        employeeId: 11,
        employeeName: '김하늘',
        dayOfWeek: 'MONDAY',
        startTime: '12:00:00',
        endTime: '18:00:00',
        breakMinutes: 30,
      },
      {
        scheduleId: 3,
        employeeId: 10,
        employeeName: '데모 직원',
        dayOfWeek: 'WEDNESDAY',
        startTime: '09:00:00',
        endTime: '15:00:00',
        breakMinutes: 30,
      },
    ],
    attendances: [
      {
        attendanceId: 1,
        storeId: 1,
        employeeId: 10,
        employeeName: '데모 직원',
        date: '2026-09-02',
        scheduledStartTime: '09:00:00',
        scheduledEndTime: '15:00:00',
        clockIn: '2026-09-02T09:01:00',
        clockOut: null,
        status: 'WORKING',
        overtime: false,
        breakMinutes: 30,
        workedMinutes: null,
        exists: true,
      },
    ],
    payrolls: demoStorePayrolls,
    contracts: demoContracts,
    auctions: [
      {
        auctionId: 1,
        storeId: 1,
        targetDate: '2026-09-05',
        targetStartTime: '10:00:00',
        targetEndTime: '14:00:00',
        deadline: '2026-09-04T18:00:00',
        minWage: 11000,
        maxWage: 14000,
        recruitCount: 2,
        status: 'IN_PROGRESS',
        winnerIds: [],
        createdAt: '2026-09-01T09:00:00',
      },
      {
        auctionId: 2,
        storeId: 1,
        targetDate: '2026-08-30',
        targetStartTime: '16:00:00',
        targetEndTime: '21:00:00',
        deadline: '2026-08-29T18:00:00',
        minWage: 11000,
        maxWage: 13500,
        recruitCount: 1,
        status: 'CLOSED',
        winnerIds: [10],
        createdAt: '2026-08-25T09:00:00',
      },
    ],
    biddersByAuction: {
      1: {
        group1: [
          {
            bidId: 1,
            employeeId: 10,
            applicantName: '데모 직원',
            proposedWage: 12000,
            tags: ['근무 가능'],
            bidTime: '2026-09-01T10:00:00',
          },
        ],
        group2: [
          {
            bidId: 2,
            employeeId: 11,
            applicantName: '김하늘',
            proposedWage: 12500,
            tags: ['경력'],
            bidTime: '2026-09-01T11:00:00',
          },
        ],
        group3: [],
      },
      2: {
        group1: [
          {
            bidId: 3,
            employeeId: 10,
            applicantName: '데모 직원',
            proposedWage: 12000,
            tags: ['낙찰'],
            bidTime: '2026-08-26T10:00:00',
          },
        ],
        group2: [],
        group3: [],
      },
    },
    rooms: [
      {
        roomId: 1,
        storeId: 1,
        roomType: 'GROUP',
        name: '매장 공지',
        sortPriority: 1,
        isArchived: false,
        lastMessageId: 1,
        lastMessageAt: '2026-09-01T09:00:00',
        members: [
          {
            userId: 1,
            name: '데모 점주',
            role: 'OWNER',
            joinedAt: '2026-01-01T00:00:00',
          },
          {
            userId: 10,
            name: '데모 직원',
            role: 'MEMBER',
            joinedAt: '2026-01-02T00:00:00',
          },
        ],
      },
    ],
    messagesByRoom: {
      1: [
        {
          messageId: 1,
          roomId: 1,
          senderId: 10,
          senderName: '데모 직원',
          messageType: 'TEXT',
          content: '데모 매장에 오신 것을 환영합니다.',
          fileUrl: null,
          sentAt: '2026-09-01T09:00:00',
          isDeleted: false,
        },
      ],
    },
    lastReadMessageIdByRoom: { 1: 0 },
    notifications: [
      {
        id: 1,
        title: '오늘의 근무',
        body: '09:00 출근 일정이 있습니다.',
        type: 'SCHEDULE',
        targetId: 1,
        isRead: false,
        createdAt: '2026-09-02T08:00:00',
      },
      {
        id: 2,
        title: '경매 입찰',
        body: '새 입찰이 도착했습니다.',
        type: 'AUCTION',
        targetId: 1,
        isRead: false,
        createdAt: '2026-09-01T10:00:00',
      },
    ],
    nextIds: {
      schedule: 4,
      attendance: 2,
      auction: 3,
      bid: 4,
      room: 2,
      contract: 3,
      message: 2,
    },
  };
}
