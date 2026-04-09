export type DocumentCategory = 'PAYSLIP' | 'CONTRACT' | 'ETC';

export interface DocumentEmployeeOption {
  id: string;
  name: string;
}

export interface PayslipDocument {
  id: string;
  year: number;
  month: number;
  employeeName: string;
  issuedAt: string;
  title: string;
  pdfUrl: string;
  status: '발송 완료' | '확정';
}

export interface BasicDocument {
  id: string;
  category: Exclude<DocumentCategory, 'PAYSLIP' | 'CONTRACT'>;
  title: string;
  employeeName: string;
  issuedAt: string;
}

export interface PayslipMonthGroup {
  month: number;
  items: PayslipDocument[];
}

export const DOCUMENT_EMPLOYEE_OPTIONS: DocumentEmployeeOption[] = [
  { id: 'employee-101', name: '차직원' },
  { id: 'employee-102', name: '박직원' },
  { id: 'employee-103', name: '최직원' },
];

export const PAYSLIP_DOCUMENTS: PayslipDocument[] = [
  {
    id: 'payslip-2026-03-101',
    year: 2026,
    month: 3,
    employeeName: '차직원',
    issuedAt: '2026.04.05',
    title: '차직원 2026년 3월 급여명세서',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: '발송 완료',
  },
  {
    id: 'payslip-2026-03-102',
    year: 2026,
    month: 3,
    employeeName: '박직원',
    issuedAt: '2026.04.05',
    title: '박직원 2026년 3월 급여명세서',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: '발송 완료',
  },
  {
    id: 'payslip-2026-02-101',
    year: 2026,
    month: 2,
    employeeName: '차직원',
    issuedAt: '2026.03.05',
    title: '차직원 2026년 2월 급여명세서',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: '확정',
  },
  {
    id: 'payslip-2026-02-102',
    year: 2026,
    month: 2,
    employeeName: '박직원',
    issuedAt: '2026.03.05',
    title: '박직원 2026년 2월 급여명세서',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: '확정',
  },
  {
    id: 'payslip-2026-02-103',
    year: 2026,
    month: 2,
    employeeName: '최직원',
    issuedAt: '2026.03.05',
    title: '최직원 2026년 2월 급여명세서',
    pdfUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: '확정',
  },
];

export const OTHER_DOCUMENTS: BasicDocument[] = [
  {
    id: 'etc-health-kim-001',
    category: 'ETC',
    title: '김지희 보건증',
    employeeName: '김지희',
    issuedAt: '2025.12.11',
  },
  {
    id: 'etc-bank-park-001',
    category: 'ETC',
    title: '박서준 통장 사본',
    employeeName: '박서준',
    issuedAt: '2026.01.08',
  },
];

export const DOCUMENT_TAB_OPTIONS: Array<{
  key: DocumentCategory;
  label: string;
}> = [
  { key: 'PAYSLIP', label: '급여명세서' },
  { key: 'CONTRACT', label: '근로계약서' },
  { key: 'ETC', label: '기타문서' },
];

export function getAvailableYears(payslips: PayslipDocument[]): number[] {
  return [...new Set(payslips.map((item) => item.year))].sort((a, b) => b - a);
}

export function groupPayslipsByMonth(
  payslips: PayslipDocument[],
  targetYear: number
): PayslipMonthGroup[] {
  const monthMap = new Map<number, PayslipDocument[]>();

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
      items: [...items].sort((a, b) =>
        a.employeeName.localeCompare(b.employeeName)
      ),
    }));
}

export function findPayslipById(id?: string): PayslipDocument | null {
  if (!id) return null;
  return PAYSLIP_DOCUMENTS.find((item) => item.id === id) ?? null;
}
