import dayjs from 'dayjs';
import { Calendar, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createContract, signByOwner } from '@/api/contract';
import { getApiErrorMessage } from '@/api/error';
import DatePickerModal from '@/components/common/DateSheet';
import { ROUTES } from '@/constants/routes';
import DocumentEmployeeSearchModal from '@/features/documents/components/DocumentEmployeeSearchModal';
import DocumentsPageLayout from '@/features/documents/components/DocumentsPageLayout';
import {
  RequestPickerField,
  RequestSection,
  RequestTextArea,
  RequestTextInput,
} from '@/features/documents/components/RequestFormPrimitives';
import SignaturePad from '@/features/documents/components/SignaturePad';
import type { OwnerContractForm } from '@/features/documents/data/mockContracts';
import useStoreStore from '@/stores/useStoreStore';

const PAGE_TEXT = {
  pageTitle: '근로계약서 작성',
  baseInfo: '기본 정보',
  workCondition: '근무 조건',
  payAndInsurance: '임금 및 보험',
  businessInfo: '사업체 정보 및 서명',
  employeeName: '직원 이름',
  employeePlaceholder: '직원 선택',
  employeeAddress: '근로자 주소',
  employeeAddressPlaceholder: '예: 서울시 서초구 서초동 456',
  contractStartDate: '근로계약 시작일',
  contractEndDate: '근로계약 종료일',
  datePlaceholder: '날짜 선택',
  workPlace: '근무 장소',
  workPlacePlaceholder: '예: 서울시 강남구 테헤란로 123',
  workDescription: '업무 내용',
  workDescriptionPlaceholder: '예: 매장 고객 응대 및 음료 제조',
  workStartTime: '근무 시작 시간',
  workEndTime: '근무 종료 시간',
  breakStartTime: '휴게 시작 시간',
  breakEndTime: '휴게 종료 시간',
  timePlaceholder: '예: 09:00',
  workDays: '근무일',
  workDaysPlaceholder: '예: 5 (1~7)',
  weeklyHoliday: '주휴일',
  weeklyHolidayPlaceholder: '예: 일요일 (복수 가능)',
  hourlyWage: '시급',
  hourlyWagePlaceholder: '예: 10320',
  payday: '임금 지급일',
  paydayPlaceholder: '예: 10일',
  hasBonus: '상여금',
  bonusAmountPlaceholder: '상여금 금액',
  hasOtherPay: '기타급여',
  otherPayNamePlaceholder: '항목명 (예: 식비)',
  otherPayAmountPlaceholder: '금액',
  insurance: '사회보험 적용 여부',
  writtenDate: '작성일',
  businessName: '사업체명',
  businessAddress: '주소',
  representativeName: '대표자',
  businessPhone: '전화번호',
  businessPhonePlaceholder: '예: 010-1234-5678',
  ownerSignature: '사장님 서명',
  submit: '직원에게 전송',
  requiredError: '필수 항목을 먼저 입력해 주세요.',
  success: '근로계약서를 직원에게 전송했습니다.',
  yes: '있음',
} as const;

const EMPTY_FORM: OwnerContractForm = {
  employeeName: '',
  contractStartDate: '',
  contractEndDate: '',
  workPlace: '',
  workDescription: '',
  scheduledStartTime: '',
  scheduledEndTime: '',
  breakStartTime: '',
  breakEndTime: '',
  weeklyWorkDays: '',
  weeklyHolidayType: 'WEEKDAY',
  weeklyHoliday: '',
  hourlyWage: '',
  hasBonus: false,
  bonusAmount: '',
  hasOtherPay: false,
  otherPayName: '',
  otherPayAmount: '',
  payday: '',
  insuranceEmployment: false,
  insuranceIndustrial: false,
  insuranceNationalPension: false,
  insuranceHealth: false,
  writtenDate: '',
  businessName: '',
  businessAddress: '',
  representativeName: '',
  businessPhone: '',
  ownerSignatureDataUrl: '',
};

const TIME_FIELD_KEYS = new Set<keyof OwnerContractForm>([
  'scheduledStartTime',
  'scheduledEndTime',
  'breakStartTime',
  'breakEndTime',
]);

function formatTimeTyping(rawValue: string) {
  const digits = rawValue.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, digits.length - 2)}:${digits.slice(-2)}`;
}

export default function ContractRequestPage() {
  const navigate = useNavigate();
  const currentStore = useStoreStore((s) => s.currentStore);
  const [form, setForm] = useState<OwnerContractForm>(EMPTY_FORM);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [datePickerField, setDatePickerField] = useState<
    keyof OwnerContractForm | null
  >(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [employeeAddress, setEmployeeAddress] = useState('');

  const canSubmit = useMemo(
    () =>
      Boolean(
        selectedEmployeeId !== null &&
        form.employeeName &&
        form.contractStartDate &&
        form.workPlace &&
        form.workDescription &&
        form.scheduledStartTime &&
        form.scheduledEndTime &&
        form.weeklyWorkDays &&
        form.weeklyHoliday &&
        form.hourlyWage &&
        form.payday &&
        form.writtenDate &&
        form.ownerSignatureDataUrl &&
        employeeAddress
      ),
    [form, selectedEmployeeId, employeeAddress]
  );

  const patchForm = <K extends keyof OwnerContractForm>(
    key: K,
    value: OwnerContractForm[K]
  ) => {
    const normalizedValue = TIME_FIELD_KEYS.has(key)
      ? (formatTimeTyping(String(value ?? '')) as OwnerContractForm[K])
      : value;

    setForm((prev) => ({ ...prev, [key]: normalizedValue }));
  };

  const handleDateConfirm = (date: dayjs.Dayjs) => {
    if (!datePickerField) return;

    patchForm(datePickerField, date.format('YYYY-MM-DD'));
    setDatePickerField(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !currentStore || selectedEmployeeId === null) {
      toast.error(PAGE_TEXT.requiredError);
      return;
    }

    try {
      const created = await createContract(
        currentStore.storeId,
        selectedEmployeeId,
        {
          contractStartDate: form.contractStartDate,
          contractEndDate: form.contractEndDate || null,
          workplace: form.workPlace || undefined,
          jobDescription: form.workDescription,
          workStartTime: form.scheduledStartTime,
          workEndTime: form.scheduledEndTime,
          breakStartTime: form.breakStartTime || null,
          breakEndTime: form.breakEndTime || null,
          workDaysPerWeek: parseInt(form.weeklyWorkDays, 10),
          weeklyHoliday: form.weeklyHoliday,
          wageType: 'HOURLY',
          wageAmount: parseInt(form.hourlyWage, 10),
          hasBonus: form.hasBonus,
          bonusAmount:
            form.hasBonus && form.bonusAmount
              ? parseInt(form.bonusAmount, 10)
              : null,
          hasOtherAllowance: form.hasOtherPay,
          otherAllowanceDetails: form.hasOtherPay
            ? `${form.otherPayName} ${form.otherPayAmount}원`
            : null,
          payDayDescription: `매월 ${form.payday}일`,
          employmentInsurance: form.insuranceEmployment,
          industrialAccidentInsurance: form.insuranceIndustrial,
          nationalPension: form.insuranceNationalPension,
          healthInsurance: form.insuranceHealth,
          contractDate: form.writtenDate,
          employeeAddress,
        }
      );
      await signByOwner(currentStore.storeId, created.contractId, {
        signature: form.ownerSignatureDataUrl,
      });
      toast.success(PAGE_TEXT.success);
      navigate(`${ROUTES.DOCUMENTS_MY}?tab=CONTRACT`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, '계약서 전송에 실패했습니다.'));
    }
  };

  return (
    <DocumentsPageLayout
      title={PAGE_TEXT.pageTitle}
      mainClassName="pb-[calc(var(--height-bottom-nav)+var(--space-8)+env(safe-area-inset-bottom,0px))]"
    >
      <div className="space-y-[var(--space-4)] px-[var(--space-5)] pt-[var(--space-5)]">
        <RequestSection title={PAGE_TEXT.baseInfo}>
          <RequestPickerField
            label={PAGE_TEXT.employeeName}
            value={form.employeeName}
            placeholder={PAGE_TEXT.employeePlaceholder}
            icon={
              <Search className="h-5 w-5 text-[var(--color-text-secondary)]" />
            }
            onClick={() => setIsEmployeeModalOpen(true)}
          />

          <div className="space-y-[var(--space-2)]">
            <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
              {PAGE_TEXT.employeeAddress}
            </p>
            <RequestTextInput
              value={employeeAddress}
              onChange={(value) => setEmployeeAddress(value)}
              placeholder={PAGE_TEXT.employeeAddressPlaceholder}
            />
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-2)]">
            <RequestPickerField
              label={PAGE_TEXT.contractStartDate}
              value={form.contractStartDate}
              placeholder={PAGE_TEXT.datePlaceholder}
              icon={
                <Calendar className="h-5 w-5 text-[var(--color-text-secondary)]" />
              }
              onClick={() => setDatePickerField('contractStartDate')}
            />
            <RequestPickerField
              label={PAGE_TEXT.contractEndDate}
              value={form.contractEndDate}
              placeholder={PAGE_TEXT.datePlaceholder}
              icon={
                <Calendar className="h-5 w-5 text-[var(--color-text-secondary)]" />
              }
              onClick={() => setDatePickerField('contractEndDate')}
            />
          </div>

          <div className="space-y-[var(--space-2)]">
            <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
              {PAGE_TEXT.workPlace}
            </p>
            <RequestTextInput
              value={form.workPlace}
              onChange={(value) => patchForm('workPlace', value)}
              placeholder={PAGE_TEXT.workPlacePlaceholder}
            />
          </div>

          <div className="space-y-[var(--space-2)]">
            <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
              {PAGE_TEXT.workDescription}
            </p>
            <RequestTextArea
              value={form.workDescription}
              onChange={(value) => patchForm('workDescription', value)}
              placeholder={PAGE_TEXT.workDescriptionPlaceholder}
            />
          </div>
        </RequestSection>

        <RequestSection title={PAGE_TEXT.workCondition}>
          <div className="grid grid-cols-2 gap-[var(--space-2)]">
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.workStartTime}
              </p>
              <RequestTextInput
                type="text"
                value={form.scheduledStartTime}
                onChange={(value) => patchForm('scheduledStartTime', value)}
                placeholder={PAGE_TEXT.timePlaceholder}
              />
            </div>
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.workEndTime}
              </p>
              <RequestTextInput
                type="text"
                value={form.scheduledEndTime}
                onChange={(value) => patchForm('scheduledEndTime', value)}
                placeholder={PAGE_TEXT.timePlaceholder}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-2)]">
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.breakStartTime}
              </p>
              <RequestTextInput
                type="text"
                value={form.breakStartTime}
                onChange={(value) => patchForm('breakStartTime', value)}
                placeholder={PAGE_TEXT.timePlaceholder}
              />
            </div>
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.breakEndTime}
              </p>
              <RequestTextInput
                type="text"
                value={form.breakEndTime}
                onChange={(value) => patchForm('breakEndTime', value)}
                placeholder={PAGE_TEXT.timePlaceholder}
              />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1fr] gap-[var(--space-2)]">
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.workDays}
              </p>
              <RequestTextInput
                value={form.weeklyWorkDays}
                onChange={(value) => patchForm('weeklyWorkDays', value)}
                placeholder={PAGE_TEXT.workDaysPlaceholder}
              />
            </div>
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.weeklyHoliday}
              </p>
              <RequestTextInput
                value={form.weeklyHoliday}
                onChange={(value) => patchForm('weeklyHoliday', value)}
                placeholder={PAGE_TEXT.weeklyHolidayPlaceholder}
              />
            </div>
          </div>
        </RequestSection>

        <RequestSection title={PAGE_TEXT.payAndInsurance}>
          <div className="grid grid-cols-[1fr_1fr] gap-[var(--space-2)]">
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.hourlyWage}
              </p>
              <RequestTextInput
                type="number"
                align="right"
                suffix="원"
                value={form.hourlyWage}
                onChange={(value) => patchForm('hourlyWage', value)}
                placeholder={PAGE_TEXT.hourlyWagePlaceholder}
              />
            </div>
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.payday}
              </p>
              <RequestTextInput
                align="right"
                value={form.payday}
                onChange={(value) => patchForm('payday', value)}
                placeholder={PAGE_TEXT.paydayPlaceholder}
              />
            </div>
          </div>

          <div className="space-y-[var(--space-2)]">
            <div className="flex items-center justify-between">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.hasBonus}
              </p>
              <label className="inline-flex cursor-pointer items-center gap-[var(--space-1)] text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.hasBonus}
                  onChange={(event) =>
                    patchForm('hasBonus', event.target.checked)
                  }
                  className="h-5 w-5 cursor-pointer rounded border border-[var(--color-border-muted)] accent-[var(--color-primary)]"
                />
                {PAGE_TEXT.yes}
              </label>
            </div>
            {form.hasBonus && (
              <RequestTextInput
                type="number"
                align="right"
                suffix="원"
                value={form.bonusAmount}
                onChange={(value) => patchForm('bonusAmount', value)}
                placeholder={PAGE_TEXT.bonusAmountPlaceholder}
              />
            )}
          </div>

          <div className="space-y-[var(--space-2)]">
            <div className="flex items-center justify-between">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.hasOtherPay}
              </p>
              <label className="inline-flex cursor-pointer items-center gap-[var(--space-1)] text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.hasOtherPay}
                  onChange={(event) =>
                    patchForm('hasOtherPay', event.target.checked)
                  }
                  className="h-5 w-5 cursor-pointer rounded border border-[var(--color-border-muted)] accent-[var(--color-primary)]"
                />
                {PAGE_TEXT.yes}
              </label>
            </div>
            {form.hasOtherPay && (
              <div className="flex gap-[var(--space-2)]">
                <div className="flex-[3]">
                  <RequestTextInput
                    align="right"
                    value={form.otherPayName}
                    onChange={(value) => patchForm('otherPayName', value)}
                    placeholder={PAGE_TEXT.otherPayNamePlaceholder}
                  />
                </div>
                <div className="flex-[2]">
                  <RequestTextInput
                    type="number"
                    align="right"
                    suffix="원"
                    value={form.otherPayAmount}
                    onChange={(value) => patchForm('otherPayAmount', value)}
                    placeholder={PAGE_TEXT.otherPayAmountPlaceholder}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-[var(--space-2)]">
            <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
              {PAGE_TEXT.insurance}
            </p>
            <div className="grid grid-cols-2 gap-[var(--space-1)] text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
              <label className="inline-flex cursor-pointer items-center gap-[var(--space-1)]">
                <input
                  type="checkbox"
                  checked={form.insuranceEmployment}
                  onChange={(event) =>
                    patchForm('insuranceEmployment', event.target.checked)
                  }
                  className="h-5 w-5 cursor-pointer rounded border border-[var(--color-border-muted)] accent-[var(--color-primary)]"
                />
                고용보험
              </label>
              <label className="inline-flex cursor-pointer items-center gap-[var(--space-1)]">
                <input
                  type="checkbox"
                  checked={form.insuranceIndustrial}
                  onChange={(event) =>
                    patchForm('insuranceIndustrial', event.target.checked)
                  }
                  className="h-5 w-5 cursor-pointer rounded border border-[var(--color-border-muted)] accent-[var(--color-primary)]"
                />
                산재보험
              </label>
              <label className="inline-flex cursor-pointer items-center gap-[var(--space-1)]">
                <input
                  type="checkbox"
                  checked={form.insuranceNationalPension}
                  onChange={(event) =>
                    patchForm('insuranceNationalPension', event.target.checked)
                  }
                  className="h-5 w-5 cursor-pointer rounded border border-[var(--color-border-muted)] accent-[var(--color-primary)]"
                />
                국민연금
              </label>
              <label className="inline-flex cursor-pointer items-center gap-[var(--space-1)]">
                <input
                  type="checkbox"
                  checked={form.insuranceHealth}
                  onChange={(event) =>
                    patchForm('insuranceHealth', event.target.checked)
                  }
                  className="h-5 w-5 cursor-pointer rounded border border-[var(--color-border-muted)] accent-[var(--color-primary)]"
                />
                건강보험
              </label>
            </div>
          </div>
        </RequestSection>

        <RequestSection title={PAGE_TEXT.businessInfo}>
          <RequestPickerField
            label={PAGE_TEXT.writtenDate}
            value={form.writtenDate}
            placeholder={PAGE_TEXT.datePlaceholder}
            icon={
              <Calendar className="h-5 w-5 text-[var(--color-text-secondary)]" />
            }
            onClick={() => setDatePickerField('writtenDate')}
          />

          <div className="space-y-[var(--space-2)]">
            <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
              {PAGE_TEXT.businessName}
            </p>
            <RequestTextInput
              value={form.businessName}
              onChange={(value) => patchForm('businessName', value)}
            />
          </div>
          <div className="space-y-[var(--space-2)]">
            <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
              {PAGE_TEXT.businessAddress}
            </p>
            <RequestTextInput
              value={form.businessAddress}
              onChange={(value) => patchForm('businessAddress', value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-[var(--space-2)]">
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.representativeName}
              </p>
              <RequestTextInput
                value={form.representativeName}
                onChange={(value) => patchForm('representativeName', value)}
              />
            </div>
            <div className="space-y-[var(--space-2)]">
              <p className="text-[length:var(--text-sm)] font-bold text-[var(--color-text-secondary)]">
                {PAGE_TEXT.businessPhone}
              </p>
              <RequestTextInput
                value={form.businessPhone}
                onChange={(value) => patchForm('businessPhone', value)}
                placeholder={PAGE_TEXT.businessPhonePlaceholder}
              />
            </div>
          </div>

          <SignaturePad
            label={PAGE_TEXT.ownerSignature}
            value={form.ownerSignatureDataUrl}
            onChange={(value) => patchForm('ownerSignatureDataUrl', value)}
          />
        </RequestSection>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-14 w-full rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {PAGE_TEXT.submit}
        </button>

        {datePickerField && (
          <DatePickerModal
            isOpen={true}
            selectedDate={
              form[datePickerField]
                ? dayjs(form[datePickerField] as string)
                : dayjs()
            }
            onConfirm={handleDateConfirm}
            onClose={() => setDatePickerField(null)}
          />
        )}

        <DocumentEmployeeSearchModal
          isOpen={isEmployeeModalOpen}
          storeId={currentStore?.storeId || 0}
          selectedEmployeeId={selectedEmployeeId}
          selectedEmployeeName={form.employeeName}
          onClose={() => setIsEmployeeModalOpen(false)}
          onApply={({ employeeId, employeeName }) => {
            setSelectedEmployeeId(employeeId);
            patchForm('employeeName', employeeName);
          }}
        />
      </div>
    </DocumentsPageLayout>
  );
}
