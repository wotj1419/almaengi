export type EmployeeDocumentCategory = 'PAYSLIP' | 'CONTRACT' | 'ETC';

export interface EmployeePayslipDocument {
  id: string;
  year: number;
  month: number;
  employeeName: string;
  issuedAt: string;
  title: string;
  pdfUrl: string;
  status: '발송 완료' | '확정';
}

export interface EmployeeEtcDocument {
  id: string;
  category: 'ETC';
  title: string;
  issuedAt: string;
}

export interface EmployeePayslipMonthGroup {
  month: number;
  items: EmployeePayslipDocument[];
}

export const EMPLOYEE_PAYSLIP_DOCUMENTS: EmployeePayslipDocument[] = [
  {
    id: 'employee-payslip-2026-03',
    year: 2026,
    month: 3,
    employeeName: '홍길동',
    issuedAt: '2026.04.25',
    title: '2026년 3월 급여명세서',
    status: '발송 완료',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'employee-payslip-2026-02',
    year: 2026,
    month: 2,
    employeeName: '홍길동',
    issuedAt: '2026.03.25',
    title: '2026년 2월 급여명세서',
    status: '확정',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'employee-payslip-2026-01',
    year: 2026,
    month: 1,
    employeeName: '홍길동',
    issuedAt: '2026.02.25',
    title: '2026년 1월 급여명세서',
    status: '확정',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'employee-payslip-2025-12',
    year: 2025,
    month: 12,
    employeeName: '홍길동',
    issuedAt: '2026.01.25',
    title: '2025년 12월 급여명세서',
    status: '확정',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
];

export const EMPLOYEE_OTHER_DOCUMENTS: EmployeeEtcDocument[] = [
  {
    id: 'employee-etc-health-certificate',
    category: 'ETC',
    title: '보건증',
    issuedAt: '2026.03.19',
  },
  {
    id: 'employee-etc-bank-copy',
    category: 'ETC',
    title: '통장 사본',
    issuedAt: '2026.02.10',
  },
];

export function getEmployeeAvailableYears(
  payslips: EmployeePayslipDocument[]
): number[] {
  return [...new Set(payslips.map((item) => item.year))].sort((a, b) => b - a);
}

export function groupEmployeePayslipsByMonth(
  payslips: EmployeePayslipDocument[],
  targetYear: number
): EmployeePayslipMonthGroup[] {
  const monthMap = new Map<number, EmployeePayslipDocument[]>();

  payslips
    .filter((item) => item.year === targetYear)
    .forEach((item) => {
      const current = monthMap.get(item.month) ?? [];
      current.push(item);
      monthMap.set(item.month, current);
    });

  return [...monthMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([month, items]) => ({
      month,
      items: [...items],
    }));
}

export function findEmployeePayslipById(id?: string) {
  if (!id) return null;
  return EMPLOYEE_PAYSLIP_DOCUMENTS.find((item) => item.id === id) ?? null;
}
