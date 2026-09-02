import { http, HttpResponse } from 'msw';

import {
  demoAttendanceResult,
  demoPayrollSummary,
  demoStorePayrolls,
  type DemoData,
} from './data';
import { readDemoData, writeDemoData } from './storage';

const api = (path: string) => `*/api/v1/${path}`;

function success<T>(data: T, message = 'Demo request completed.') {
  return HttpResponse.json({ status: 'SUCCESS', message, data });
}

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ status: code, message, data: null }, { status });
}

function id(value: string | readonly string[] | undefined): number {
  return Number(Array.isArray(value) ? value[0] : value);
}

function save(data: DemoData) {
  writeDemoData(data);
}

function bidders(data: DemoData, auctionId: number) {
  return (data.biddersByAuction[auctionId] ??= {
    group1: [],
    group2: [],
    group3: [],
  });
}

function allBidders(data: DemoData, auctionId: number) {
  const value = bidders(data, auctionId);
  return [...value.group1, ...value.group2, ...value.group3];
}

function roomSummary(data: DemoData, roomId: number) {
  const room = data.rooms.find((item) => item.roomId === roomId);
  if (!room) return null;
  const messages = data.messagesByRoom[roomId] ?? [];
  const last = messages.at(-1) ?? null;
  const lastReadMessageId = data.lastReadMessageIdByRoom[roomId] ?? 0;
  return {
    roomId: room.roomId,
    roomType: room.roomType,
    name: room.name,
    sortPriority: room.sortPriority,
    lastMessageId: last?.messageId ?? room.lastMessageId,
    lastMessagePreview: last?.content ?? null,
    lastMessageAt: last?.sentAt ?? room.lastMessageAt,
    unreadCount: messages.filter(
      (message) =>
        message.messageId > lastReadMessageId && message.senderId !== 1
    ).length,
    memberCount: room.members.length,
  };
}

export const handlers = [
  http.get(api('stores'), () => success(readDemoData().stores)),
  http.get(api('stores/employees/my'), () => success(readDemoData().stores)),
  http.get(api('stores/:storeId'), ({ params }) => {
    const store = readDemoData().stores.find(
      (item) => item.storeId === id(params.storeId)
    );
    return store
      ? success(store)
      : error(404, 'STORE_NOT_FOUND', 'Store not found.');
  }),

  http.get(api('stores/:storeId/employees/schedules/me'), () => {
    const data = readDemoData();
    return success(data.schedules.filter((item) => item.employeeId === 10));
  }),
  http.get(
    api('stores/:storeId/employees/schedules/:dayOfWeek'),
    ({ params }) => {
      const data = readDemoData();
      return success(
        data.schedules.filter(
          (item) => item.dayOfWeek === String(params.dayOfWeek).toUpperCase()
        )
      );
    }
  ),
  http.get(
    api('stores/:storeId/employees/:employeeId/schedules'),
    ({ params }) => {
      const data = readDemoData();
      return success(
        data.schedules.filter(
          (item) => item.employeeId === id(params.employeeId)
        )
      );
    }
  ),
  http.post(
    api('stores/:storeId/employees/:employeeId/schedules'),
    async ({ params, request }) => {
      const data = readDemoData();
      const employee = data.employees.find(
        (item) => item.employeeId === id(params.employeeId)
      );
      if (!employee)
        return error(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
      const body = (await request.json()) as {
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        breakMinutes?: number;
      };
      const schedule = {
        scheduleId: data.nextIds.schedule++,
        employeeId: employee.employeeId,
        employeeName: employee.name,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        breakMinutes: body.breakMinutes ?? 0,
      };
      data.schedules.push(schedule);
      save(data);
      return success(schedule);
    }
  ),
  http.patch(
    api('stores/:storeId/employees/:employeeId/schedules/:scheduleId'),
    async ({ params, request }) => {
      const data = readDemoData();
      const schedule = data.schedules.find(
        (item) =>
          item.scheduleId === id(params.scheduleId) &&
          item.employeeId === id(params.employeeId)
      );
      if (!schedule)
        return error(404, 'SCHEDULE_NOT_FOUND', 'Schedule not found.');
      Object.assign(
        schedule,
        (await request.json()) as Partial<
          Pick<typeof schedule, 'startTime' | 'endTime' | 'breakMinutes'>
        >
      );
      save(data);
      return success(schedule);
    }
  ),
  http.delete(
    api('stores/:storeId/employees/:employeeId/schedules/:scheduleId'),
    ({ params }) => {
      const data = readDemoData();
      const index = data.schedules.findIndex(
        (item) =>
          item.scheduleId === id(params.scheduleId) &&
          item.employeeId === id(params.employeeId)
      );
      if (index < 0)
        return error(404, 'SCHEDULE_NOT_FOUND', 'Schedule not found.');
      data.schedules.splice(index, 1);
      save(data);
      return success(null);
    }
  ),

  http.get(api('stores/:storeId/employees/status'), ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    return success(
      readDemoData().employees.filter(
        (item) => !status || item.status === status
      )
    );
  }),
  http.get(api('stores/:storeId/employees'), () =>
    success(readDemoData().employees)
  ),
  http.patch(
    api('stores/:storeId/employees/:employeeId/approve'),
    ({ params }) => {
      const data = readDemoData();
      const employee = data.employees.find(
        (item) => item.employeeId === id(params.employeeId)
      );
      if (!employee)
        return error(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
      employee.status = 'WORKING';
      save(data);
      return success(employee);
    }
  ),

  http.post(api('attendances'), () => {
    const data = readDemoData();
    const existing = data.attendances.find(
      (item) => item.employeeId === 10 && !item.clockOut
    );
    const attendance = existing ?? {
      attendanceId: data.nextIds.attendance++,
      storeId: 1,
      employeeId: 10,
      employeeName: '데모 직원',
      date: new Date().toISOString().slice(0, 10),
      scheduledStartTime: '09:00:00',
      scheduledEndTime: '15:00:00',
      clockIn: new Date().toISOString(),
      clockOut: null,
      status: 'WORKING',
      overtime: false,
      breakMinutes: 30,
      workedMinutes: null,
      exists: true,
    };
    if (existing) {
      attendance.clockOut = new Date().toISOString();
      attendance.workedMinutes = 360;
    } else data.attendances.push(attendance);
    save(data);
    return success(demoAttendanceResult(attendance));
  }),
  http.get(api('attendances/me/today'), () => {
    const attendance = readDemoData().attendances.find(
      (item) => item.employeeId === 10 && !item.clockOut
    );
    return success({
      currentStatus: attendance?.status ?? null,
      scheduledEndTime: attendance?.scheduledEndTime ?? null,
    });
  }),
  http.get(api('attendances/me/log'), ({ request }) => {
    const date =
      new URL(request.url).searchParams.get('date') ??
      new Date().toISOString().slice(0, 10);
    const attendance = readDemoData().attendances.find(
      (item) => item.employeeId === 10 && item.date === date
    );
    return success(
      attendance ?? {
        storeId: 1,
        employeeId: 10,
        employeeName: '데모 직원',
        date,
        scheduledStartTime: null,
        scheduledEndTime: null,
        clockIn: null,
        clockOut: null,
        status: null,
        overtime: null,
        breakMinutes: null,
        workedMinutes: null,
        exists: false,
      }
    );
  }),
  http.get(api('attendances/dashboard/:storeId/:status'), ({ params }) => {
    const status = String(params.status).toUpperCase();
    const employees = readDemoData()
      .employees.filter((item) =>
        status === 'WORKING' || status === 'LATE'
          ? item.status === 'WORKING'
          : false
      )
      .map((item) => ({
        employeeId: item.employeeId,
        userName: item.name,
        phone: item.phone ?? '',
        scheduledStartTime: '09:00:00',
        scheduledEndTime: '15:00:00',
      }));
    return success({ status, employees });
  }),
  http.get(api('attendances/dashboard/:storeId'), () =>
    success({ working: 2, late: 0, absent: 1 })
  ),
  http.get(api('attendances/report/:storeId'), ({ request }) => {
    const targetMonth =
      new URL(request.url).searchParams.get('targetMonth') ?? '2026-09';
    const employees = readDemoData().employees.map((item) => ({
      employeeId: item.employeeId,
      employeeName: item.name,
      attendanceCount: 18,
      lateCount: 1,
      absentCount: 0,
      totalWorkMinutes: 8100,
    }));
    return success({
      targetMonth,
      employees,
      diligentEmployees: employees.slice(0, 1),
      lateChampions: employees.slice(1, 2),
    });
  }),

  http.get(api('stores/:storeId/payrolls/summary'), () =>
    success(demoPayrollSummary)
  ),
  http.get(api('stores/:storeId/pay-day'), () => success(25)),
  http.get(api('stores/:storeId/payrolls'), () => success(demoStorePayrolls)),
  http.get(api('stores/:storeId/payrolls/me'), () =>
    success({
      payrollId: 1,
      targetMonth: '2026-09',
      isEstimated: false,
      isApproved: true,
      isTransferred: false,
      transferredAt: null,
      totalWorkMinutes: 9000,
      nightWorkMinutes: 0,
      overtimeMinutes: 0,
      basicPay: 1032000,
      totalAllowance: 140000,
      totalDeduction: 32000,
      netPay: 1140000,
      details: [
        {
          detailId: 1,
          detailType: 'BASE',
          itemName: '기본급',
          amount: 1032000,
          calculationFormula: '86시간 × 12,000원',
          workMinutes: 9000,
        },
      ],
    })
  ),

  http.get(api('auctions/store/:storeId/insights-report'), () =>
    success({
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
    })
  ),
  http.get(api('auctions/store/:storeId'), ({ params }) =>
    success(
      readDemoData().auctions.filter(
        (item) => item.storeId === id(params.storeId)
      )
    )
  ),
  http.get(api('auctions/:auctionId'), ({ params }) => {
    const data = readDemoData();
    const auctionId = id(params.auctionId);
    const auction = data.auctions.find((item) => item.auctionId === auctionId);
    return auction
      ? success({ auction, bidders: data.biddersByAuction[auctionId] ?? null })
      : error(404, 'AUCTION_NOT_FOUND', 'Auction not found.');
  }),
  http.post(api('auctions/store/:storeId'), async ({ params, request }) => {
    const data = readDemoData();
    const body = (await request.json()) as Omit<
      DemoData['auctions'][number],
      'auctionId' | 'storeId' | 'status' | 'winnerIds' | 'createdAt'
    >;
    const auction = {
      ...body,
      auctionId: data.nextIds.auction++,
      storeId: id(params.storeId),
      status: 'IN_PROGRESS' as const,
      winnerIds: [],
      createdAt: new Date().toISOString(),
    };
    data.auctions.unshift(auction);
    bidders(data, auction.auctionId);
    save(data);
    return success(null);
  }),
  http.post(api('auctions/:auctionId/bids'), async ({ params, request }) => {
    const data = readDemoData();
    const auctionId = id(params.auctionId);
    const auction = data.auctions.find((item) => item.auctionId === auctionId);
    if (!auction || auction.status !== 'IN_PROGRESS')
      return error(400, 'AUCTION_NOT_AVAILABLE', 'Auction is not in progress.');
    const body = (await request.json()) as { bidWage: number };
    if (body.bidWage < auction.minWage || body.bidWage > auction.maxWage)
      return error(400, 'BID_OUT_OF_RANGE', 'Bid wage is out of range.');
    const group = bidders(data, auctionId).group3;
    const prior = allBidders(data, auctionId).find(
      (item) => item.employeeId === 10
    );
    if (prior) {
      prior.proposedWage = body.bidWage;
      prior.bidTime = new Date().toISOString();
    } else
      group.push({
        bidId: data.nextIds.bid++,
        employeeId: 10,
        applicantName: '데모 직원',
        proposedWage: body.bidWage,
        tags: ['데모'],
        bidTime: new Date().toISOString(),
      });
    save(data);
    return success(null);
  }),
  http.put(api('auctions/:auctionId'), async ({ params, request }) => {
    const data = readDemoData();
    const auction = data.auctions.find(
      (item) => item.auctionId === id(params.auctionId)
    );
    if (!auction || auction.status !== 'IN_PROGRESS')
      return error(400, 'AUCTION_NOT_AVAILABLE', 'Auction is not in progress.');
    Object.assign(auction, await request.json());
    save(data);
    return success(null);
  }),
  http.delete(api('auctions/:auctionId'), ({ params }) => {
    const data = readDemoData();
    const auction = data.auctions.find(
      (item) => item.auctionId === id(params.auctionId)
    );
    if (!auction || auction.status !== 'IN_PROGRESS')
      return error(400, 'AUCTION_NOT_AVAILABLE', 'Auction is not in progress.');
    auction.status = 'CANCELLED';
    auction.winnerIds = [];
    save(data);
    return success(null);
  }),
  http.post(api('auctions/:auctionId/close'), async ({ params, request }) => {
    const data = readDemoData();
    const auctionId = id(params.auctionId);
    const auction = data.auctions.find((item) => item.auctionId === auctionId);
    if (!auction || auction.status !== 'IN_PROGRESS')
      return error(400, 'AUCTION_NOT_AVAILABLE', 'Auction is not in progress.');
    const selectedBidIds = (
      (await request.json()) as { selectedBidIds: number[] }
    ).selectedBidIds;
    const selected = allBidders(data, auctionId).filter((item) =>
      selectedBidIds.includes(item.bidId)
    );
    if (!selected.length || selected.length > auction.recruitCount)
      return error(400, 'INVALID_WINNERS', 'Select valid auction winners.');
    auction.status = 'CLOSED';
    auction.winnerIds = selected.map((item) => item.employeeId);
    save(data);
    return success({
      auctionId,
      status: 'CLOSED',
      winners: selected.map((item) => ({
        bidId: item.bidId,
        employeeId: item.employeeId,
        employeeName: item.applicantName,
        bidWage: item.proposedWage,
      })),
    });
  }),

  http.get(api('chat/stores/:storeId/rooms'), () => {
    const data = readDemoData();
    return success(
      data.rooms
        .map((room) => roomSummary(data, room.roomId))
        .filter((room) => room !== null)
    );
  }),
  http.get(api('chat/rooms/:roomId'), ({ params }) => {
    const room = readDemoData().rooms.find(
      (item) => item.roomId === id(params.roomId)
    );
    return room
      ? success(room)
      : error(404, 'ROOM_NOT_FOUND', 'Room not found.');
  }),
  http.get(api('chat/rooms/:roomId/messages'), ({ params, request }) => {
    const values = readDemoData().messagesByRoom[id(params.roomId)] ?? [];
    const size = Number(new URL(request.url).searchParams.get('size') ?? 30);
    return success({
      messages: values.slice(-size).reverse(),
      nextCursor: null,
      size,
    });
  }),
  http.post(api('chat/rooms/:roomId/messages'), async ({ params, request }) => {
    const data = readDemoData();
    const roomId = id(params.roomId);
    const room = data.rooms.find((item) => item.roomId === roomId);
    if (!room) return error(404, 'ROOM_NOT_FOUND', 'Room not found.');
    const body = (await request.json()) as {
      messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
      content: string;
    };
    const message = {
      messageId: data.nextIds.message++,
      roomId,
      senderId: 1,
      senderName: '데모 점주',
      messageType: body.messageType,
      content: body.content,
      fileUrl: null,
      sentAt: new Date().toISOString(),
      isDeleted: false,
    };
    (data.messagesByRoom[roomId] ??= []).push(message);
    room.lastMessageId = message.messageId;
    room.lastMessageAt = message.sentAt;
    save(data);
    return success(message);
  }),
  http.post(api('chat/rooms/:roomId/read'), async ({ params, request }) => {
    const data = readDemoData();
    const roomId = id(params.roomId);
    if (!data.rooms.some((item) => item.roomId === roomId))
      return error(404, 'ROOM_NOT_FOUND', 'Room not found.');
    const { lastReadMessageId } = (await request.json()) as {
      lastReadMessageId: number;
    };
    data.lastReadMessageIdByRoom[roomId] = Math.max(
      data.lastReadMessageIdByRoom[roomId] ?? 0,
      lastReadMessageId
    );
    save(data);
    return success(null);
  }),
  http.post(
    api('chat/stores/:storeId/rooms/:roomType'),
    async ({ params, request }) => {
      const data = readDemoData();
      const body = (await request.json()) as { name?: string };
      const roomType = String(params.roomType).toUpperCase() as
        | 'DM'
        | 'GROUP'
        | 'BOT';
      const room = {
        roomId: data.nextIds.room++,
        storeId: id(params.storeId),
        roomType,
        name: body.name ?? (roomType === 'BOT' ? '알맹이 도우미' : '새 채팅'),
        sortPriority: 99,
        isArchived: false,
        lastMessageId: null,
        lastMessageAt: null,
        members: [
          {
            userId: 1,
            name: '데모 점주',
            role: 'OWNER' as const,
            joinedAt: new Date().toISOString(),
          },
        ],
      };
      data.rooms.push(room);
      data.messagesByRoom[room.roomId] = [];
      save(data);
      return success(room);
    }
  ),

  http.post(api('notifications/token'), () => success('demo-fcm-token')),
  http.get(api('notifications'), () => success(readDemoData().notifications)),
  http.patch(api('notifications/reads'), async ({ request }) => {
    const data = readDemoData();
    const ids = ((await request.json()) as { notificationIds: number[] })
      .notificationIds;
    data.notifications.forEach((item) => {
      if (ids.includes(item.id)) item.isRead = true;
    });
    save(data);
    return success('Notifications marked as read.');
  }),
  http.patch(api('notifications/:notificationId/read'), ({ params }) => {
    const data = readDemoData();
    const notification = data.notifications.find(
      (item) => item.id === id(params.notificationId)
    );
    if (!notification)
      return error(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
    notification.isRead = true;
    save(data);
    return success('Notification marked as read.');
  }),

  http.all('*/api/*', () =>
    error(
      501,
      'DEMO_API_NOT_IMPLEMENTED',
      'This API is not implemented in the portfolio demo.'
    )
  ),
];
