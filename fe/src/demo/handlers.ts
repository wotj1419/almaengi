import { http, HttpResponse } from 'msw';

import {
  demoAttendanceReport,
  demoAttendanceResult,
  demoAuctionInsightsReport,
  demoPayrollDetails,
  demoPayrollSummary,
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

function payrollDetail(data: DemoData, payrollId: number) {
  const payroll = data.payrolls.employees.find(
    (item) => item.payrollId === payrollId
  );
  if (!payroll) return null;
  const template = demoPayrollDetails[payrollId] ?? demoPayrollDetails[1];
  return {
    ...template,
    payrollId,
    employeeName: payroll.employeeName,
    totalWorkMinutes: payroll.totalWorkMinutes,
    basicPay: payroll.basicPay,
    totalAllowance: payroll.totalAllowance,
    totalDeduction: payroll.totalDeduction,
    netPay: payroll.netPay,
    isApproved: payroll.isApproved,
  };
}

function contractSummary(contract: DemoData['contracts'][number]) {
  return {
    contractId: contract.contractId,
    employeeName: contract.employeeName,
    status: contract.status,
    contractDate: contract.contractDate,
    contractStartDate: contract.contractStartDate,
    contractEndDate: contract.contractEndDate,
    createdAt: contract.createdAt,
  };
}

function pdf(fileName: string) {
  const stream = `BT\n/F1 18 Tf\n72 720 Td\n(Almaengi demo document) Tj\nET\n`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ];
  let document = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(document.length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new HttpResponse(new TextEncoder().encode(document), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${fileName}"`,
    },
  });
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
      new URL(request.url).searchParams.get('targetMonth') ??
      demoAttendanceReport.targetMonth;
    return success({ ...demoAttendanceReport, targetMonth });
  }),
  http.get(api('stores/:storeId/payrolls/summary'), ({ request }) => {
    const targetMonth =
      new URL(request.url).searchParams.get('targetMonth') ??
      demoPayrollSummary.targetMonth;
    return success({ ...demoPayrollSummary, targetMonth });
  }),
  http.get(api('stores/:storeId/pay-day'), () => success(25)),
  http.get(api('stores/:storeId/payrolls/me'), () => {
    const data = readDemoData();
    const payroll = data.payrolls.employees.find(
      (item) => item.employeeId === 10
    );
    if (!payroll)
      return success({
        payrollId: null,
        targetMonth: data.payrolls.targetMonth,
        isEstimated: false,
        isApproved: false,
        isTransferred: false,
        transferredAt: null,
        totalWorkMinutes: 0,
        nightWorkMinutes: 0,
        overtimeMinutes: 0,
        basicPay: 0,
        totalAllowance: 0,
        totalDeduction: 0,
        netPay: 0,
        details: [],
      });
    const detail = payrollDetail(data, payroll.payrollId);
    return success({
      payrollId: payroll.payrollId,
      targetMonth: data.payrolls.targetMonth,
      isEstimated: false,
      isApproved: payroll.isApproved,
      isTransferred: payroll.isTransferred,
      transferredAt: payroll.transferredAt,
      totalWorkMinutes: payroll.totalWorkMinutes,
      nightWorkMinutes: 0,
      overtimeMinutes: 0,
      basicPay: payroll.basicPay,
      totalAllowance: payroll.totalAllowance,
      totalDeduction: payroll.totalDeduction,
      netPay: payroll.netPay,
      details: [
        ...(detail?.baseItems ?? []),
        ...(detail?.allowanceItems ?? []),
        ...(detail?.deductionItems ?? []),
      ],
    });
  }),
  http.get(api('stores/:storeId/payrolls/:payrollId/payslip'), ({ params }) => {
    const detail = payrollDetail(readDemoData(), id(params.payrollId));
    return detail
      ? pdf(`payslip-${detail.payrollId}.pdf`)
      : error(404, 'PAYROLL_NOT_FOUND', 'Payroll not found.');
  }),
  http.get(api('stores/:storeId/payrolls/:payrollId'), ({ params }) => {
    const detail = payrollDetail(readDemoData(), id(params.payrollId));
    return detail
      ? success(detail)
      : error(404, 'PAYROLL_NOT_FOUND', 'Payroll not found.');
  }),
  http.get(api('stores/:storeId/payrolls'), () =>
    success(readDemoData().payrolls)
  ),
  http.patch(api('stores/:storeId/payrolls/approve-all'), () => {
    const data = readDemoData();
    data.payrolls.employees.forEach((payroll) => {
      payroll.isApproved = true;
    });
    save(data);
    return success(data.payrolls.employees.length);
  }),
  http.post(api('stores/:storeId/payrolls/transfer'), () => {
    const data = readDemoData();
    const transferredAt = new Date().toISOString();
    data.payrolls.employees.forEach((payroll) => {
      if (payroll.isApproved) {
        payroll.isTransferred = true;
        payroll.transferredAt = transferredAt;
      }
    });
    save(data);
    return success(null);
  }),

  http.post(
    api('stores/:storeId/contracts/:employeeId'),
    async ({ params, request }) => {
      const data = readDemoData();
      const employee = data.employees.find(
        (item) => item.employeeId === id(params.employeeId)
      );
      const store = data.stores.find(
        (item) => item.storeId === id(params.storeId)
      );
      if (!employee || !store)
        return error(404, 'EMPLOYEE_NOT_FOUND', 'Employee or store not found.');
      const body = (await request.json()) as {
        contractStartDate: string;
        contractEndDate?: string | null;
        workplace?: string;
        jobDescription: string;
        workStartTime: string;
        workEndTime: string;
        breakStartTime?: string | null;
        breakEndTime?: string | null;
        workDaysPerWeek: number;
        weeklyHoliday: string;
        wageType: 'HOURLY' | 'DAILY' | 'MONTHLY';
        wageAmount: number;
        hasBonus: boolean;
        bonusAmount?: number | null;
        hasOtherAllowance: boolean;
        otherAllowanceDetails?: string | null;
        payDayDescription: string;
        employmentInsurance: boolean;
        industrialAccidentInsurance: boolean;
        nationalPension: boolean;
        healthInsurance: boolean;
        contractDate: string;
        employeeAddress: string;
      };
      const now = new Date().toISOString();
      const contract: DemoData['contracts'][number] = {
        contractId: data.nextIds.contract++,
        storeEmployeeId: employee.employeeId,
        employerName: '데모 점주',
        storeName: store.storeName,
        storeAddress: store.address ?? '',
        storePhone: store.phone ?? '',
        employeeName: employee.name,
        employeePhone: employee.phone ?? '',
        employeeAddress: body.employeeAddress,
        contractStartDate: body.contractStartDate,
        contractEndDate: body.contractEndDate ?? null,
        workplace: body.workplace ?? store.storeName,
        jobDescription: body.jobDescription,
        workStartTime: body.workStartTime,
        workEndTime: body.workEndTime,
        breakStartTime: body.breakStartTime ?? null,
        breakEndTime: body.breakEndTime ?? null,
        workDaysPerWeek: body.workDaysPerWeek,
        weeklyHoliday: body.weeklyHoliday,
        wageType: body.wageType,
        wageAmount: body.wageAmount,
        hasBonus: body.hasBonus,
        bonusAmount: body.bonusAmount ?? null,
        hasOtherAllowance: body.hasOtherAllowance,
        otherAllowanceDetails: body.otherAllowanceDetails ?? null,
        payDayDescription: body.payDayDescription,
        paymentMethod: '계좌이체',
        employmentInsurance: body.employmentInsurance,
        industrialAccidentInsurance: body.industrialAccidentInsurance,
        nationalPension: body.nationalPension,
        healthInsurance: body.healthInsurance,
        contractDate: body.contractDate,
        status: 'DRAFT',
        ownerSigned: false,
        ownerSignedAt: null,
        employeeSigned: false,
        employeeSignedAt: null,
        createdAt: now,
      };
      data.contracts.push(contract);
      save(data);
      return success(contract);
    }
  ),
  http.get(api('stores/:storeId/contracts/me'), () =>
    success(
      readDemoData()
        .contracts.filter((contract) => contract.storeEmployeeId === 10)
        .map(contractSummary)
    )
  ),
  http.get(api('stores/:storeId/contracts/:contractId/pdf'), ({ params }) => {
    const contract = readDemoData().contracts.find(
      (item) => item.contractId === id(params.contractId)
    );
    return contract
      ? pdf(`contract-${contract.contractId}.pdf`)
      : error(404, 'CONTRACT_NOT_FOUND', 'Contract not found.');
  }),
  http.patch(
    api('stores/:storeId/contracts/:contractId/sign/owner'),
    ({ params }) => {
      const data = readDemoData();
      const contract = data.contracts.find(
        (item) => item.contractId === id(params.contractId)
      );
      if (!contract)
        return error(404, 'CONTRACT_NOT_FOUND', 'Contract not found.');
      contract.ownerSigned = true;
      contract.ownerSignedAt ??= new Date().toISOString();
      contract.status = contract.employeeSigned ? 'COMPLETED' : 'OWNER_SIGNED';
      save(data);
      return success(contract);
    }
  ),
  http.patch(
    api('stores/:storeId/contracts/:contractId/sign/employee'),
    ({ params }) => {
      const data = readDemoData();
      const contract = data.contracts.find(
        (item) => item.contractId === id(params.contractId)
      );
      if (!contract)
        return error(404, 'CONTRACT_NOT_FOUND', 'Contract not found.');
      contract.employeeSigned = true;
      contract.employeeSignedAt ??= new Date().toISOString();
      contract.status = contract.ownerSigned ? 'COMPLETED' : 'DRAFT';
      save(data);
      return success(contract);
    }
  ),
  http.get(api('stores/:storeId/contracts/:contractId'), ({ params }) => {
    const contract = readDemoData().contracts.find(
      (item) => item.contractId === id(params.contractId)
    );
    return contract
      ? success(contract)
      : error(404, 'CONTRACT_NOT_FOUND', 'Contract not found.');
  }),
  http.get(api('stores/:storeId/contracts'), () =>
    success(readDemoData().contracts.map(contractSummary))
  ),
  http.get(api('auctions/store/:storeId/insights-report'), ({ request }) => {
    const yearMonth =
      new URL(request.url).searchParams.get('yearMonth') ??
      demoAuctionInsightsReport.yearMonth;
    return success({ ...demoAuctionInsightsReport, yearMonth });
  }),
  http.get(api('auctions/store/:storeId'), ({ params }) =>
    success(
      readDemoData().auctions.filter(
        (item) => item.storeId === id(params.storeId)
      )
    )
  ),
  http.get(api('auctions/:auctionId/insights'), ({ request }) => {
    const yearMonth =
      new URL(request.url).searchParams.get('yearMonth') ??
      demoAuctionInsightsReport.yearMonth;
    return success({ ...demoAuctionInsightsReport, yearMonth });
  }),
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
