import { MapPin, Search, ChevronDown } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/common/DetailHeader';
import { getApiErrorMessage } from '@/api/error';
import { createStore, updateStore } from '@/api/store';
import useAuthStore from '@/stores/useAuthStore';
import useStoreStore from '@/stores/useStoreStore';

const LABEL_CLASS =
  'px-[var(--space-1)] pb-[var(--space-2)] text-[15px] font-bold text-[var(--color-text-secondary)] leading-5';

const INPUT_BASE_CLASS =
  'w-full h-14 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none';

const PHONE_PREFIXES = [
  '010',
  '011',
  '016',
  '017',
  '018',
  '019',
  '02',
  '031',
  '032',
  '033',
  '041',
  '042',
  '043',
  '044',
  '051',
  '052',
  '053',
  '054',
  '055',
  '061',
  '062',
  '063',
  '064',
  '070',
];

function parsePhone(phone: string | null) {
  if (!phone) return { prefix: '010', mid: '', last: '' };
  const parts = phone.split('-');
  if (parts.length === 3)
    return { prefix: parts[0], mid: parts[1], last: parts[2] };
  return { prefix: '010', mid: '', last: '' };
}

export default function StoreRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.mode === 'edit';

  const currentStore = useStoreStore((s) => s.currentStore);
  const setStores = useStoreStore((s) => s.setStores);
  const setActiveStoreId = useAuthStore((state) => state.setActiveStoreId);

  const initialPhone = parsePhone(currentStore?.phone ?? null);

  const [storeName, setStoreName] = useState(currentStore?.storeName ?? '');
  const [address, setAddress] = useState(currentStore?.address ?? '');
  const [phonePrefix, setPhonePrefix] = useState(initialPhone.prefix);
  const [phoneMid, setPhoneMid] = useState(initialPhone.mid);
  const [phoneLast, setPhoneLast] = useState(initialPhone.last);
  const [isPrefixOpen, setIsPrefixOpen] = useState(false);
  const [isOver5Employees, setIsOver5Employees] = useState(
    currentStore?.isOver5Employees ?? false
  );
  const [storeNameError, setStoreNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const midRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  const openAddressSearch = () => {
    const load = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window as any).daum.Postcode({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oncomplete: (data: any) => {
          const fullAddress = data.roadAddress || data.jibunAddress;
          setAddress(fullAddress);
          if (addressError) setAddressError('');
        },
      }).open();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).daum?.Postcode) {
      load();
      return;
    }

    const script = document.createElement('script');
    script.src =
      'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.onload = load;
    document.head.appendChild(script);
  };

  const handlePrefixSelect = (prefix: string) => {
    setPhonePrefix(prefix);
    setIsPrefixOpen(false);
    midRef.current?.focus();
  };

  const handleMidChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setPhoneMid(digits);
    if (digits.length === 4) lastRef.current?.focus();
  };

  const handleRegister = async () => {
    if (isSubmitting) return;

    const trimmedName = storeName.trim();
    const trimmedAddress = address.trim();
    let hasError = false;

    if (!trimmedName) {
      setStoreNameError('매장명을 입력해 주세요.');
      hasError = true;
    } else {
      setStoreNameError('');
    }

    if (!trimmedAddress) {
      setAddressError('매장 주소를 입력해 주세요.');
      hasError = true;
    } else {
      setAddressError('');
    }

    if (hasError) return;

    setIsSubmitting(true);
    const resolvedPhone =
      phoneMid && phoneLast ? `${phonePrefix}-${phoneMid}-${phoneLast}` : null;

    try {
      if (isEditMode && currentStore) {
        const updatedStore = await updateStore(currentStore.storeId, {
          storeName: trimmedName,
          address: trimmedAddress,
          phone: resolvedPhone,
          isOver5Employees,
        });
        setStores([updatedStore]);
      } else {
        const createdStore = await createStore({
          storeName: trimmedName,
          address: trimmedAddress,
          phone: resolvedPhone,
          isOver5Employees,
        });
        setStores([createdStore]);
        setActiveStoreId(createdStore.storeId);
      }
      navigate(ROUTES.STORE);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEditMode
            ? '매장 정보 수정에 실패했어요.'
            : '매장 등록에 실패했어요.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
      <div className="w-full md:max-w-[600px] min-h-screen flex flex-col bg-[var(--color-bg-base)]">
        <DetailHeader
          title={isEditMode ? '매장 정보 수정' : '새 매장 등록'}
          onBack={() => navigate(-1)}
        />

        <main className="flex-1 px-[15px] pt-[var(--space-7)] pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
          <section className="flex flex-col gap-[var(--space-4)]">
            <div className="flex flex-col">
              <label className={LABEL_CLASS}>매장명</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => {
                  setStoreName(e.target.value);
                  if (storeNameError) setStoreNameError('');
                }}
                placeholder="예: 알바천국 카페 강남점"
                className={`${INPUT_BASE_CLASS} ${storeNameError ? 'border-red-400' : ''}`}
              />
              {storeNameError && (
                <span className="mt-1 text-[length:var(--text-sm)] text-red-500">
                  {storeNameError}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label className={LABEL_CLASS}>매장 주소</label>
              <div className="relative">
                <Search
                  size={18}
                  color="var(--color-text-placeholder)"
                  strokeWidth={2}
                  className="absolute left-[var(--space-5)] top-1/2 -translate-y-1/2"
                />
                <input
                  type="text"
                  value={address}
                  readOnly
                  onClick={openAddressSearch}
                  placeholder="주소 검색"
                  className={`${INPUT_BASE_CLASS} pl-12 cursor-pointer ${addressError ? 'border-red-400' : ''}`}
                />
              </div>

              <div className="mt-[var(--space-4)] h-32 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] flex items-center justify-center">
                <div className="inline-flex items-center gap-[var(--space-2)] text-[var(--color-text-muted)]">
                  <MapPin size={18} strokeWidth={2} />
                  <span className="text-[length:var(--text-sm)] font-medium">
                    지도 미리보기
                  </span>
                </div>
              </div>
              {addressError && (
                <span className="mt-1 text-[length:var(--text-sm)] text-red-500">
                  {addressError}
                </span>
              )}
            </div>

            <div className="flex flex-col mt-[var(--space-4)]">
              <label className={LABEL_CLASS}>연락처 (선택)</label>
              <div className="flex items-center gap-[var(--space-2)] w-full">
                {/* 지역번호 선택 */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPrefixOpen((v) => !v)}
                    className="flex items-center justify-center gap-1 w-20 h-14 px-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)] cursor-pointer"
                  >
                    {phonePrefix}
                    <ChevronDown
                      size={16}
                      color="var(--color-text-placeholder)"
                      strokeWidth={2}
                    />
                  </button>
                  {isPrefixOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsPrefixOpen(false)}
                      />
                      <ul className="absolute top-[calc(100%+4px)] left-0 z-20 w-24 max-h-48 overflow-y-auto bg-[var(--color-bg-white)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] shadow-[var(--shadow-form-card)]">
                        {PHONE_PREFIXES.map((p) => (
                          <li key={p}>
                            <button
                              type="button"
                              onClick={() => handlePrefixSelect(p)}
                              className={`w-full px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--text-md2)] cursor-pointer ${
                                p === phonePrefix
                                  ? 'font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-base)]'
                                  : 'font-medium text-[var(--color-text-secondary)]'
                              }`}
                            >
                              {p}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                {/* 중간 번호 */}
                <input
                  ref={midRef}
                  type="tel"
                  inputMode="numeric"
                  value={phoneMid}
                  onChange={(e) => handleMidChange(e.target.value)}
                  placeholder="0000"
                  maxLength={4}
                  className="flex-1 min-w-0 h-14 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] px-[var(--space-3)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none text-center"
                />

                <span className="text-[var(--color-text-muted)] font-medium shrink-0">
                  -
                </span>

                {/* 끝 번호 */}
                <input
                  ref={lastRef}
                  type="tel"
                  inputMode="numeric"
                  value={phoneLast}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 4);
                    setPhoneLast(digits);
                    if (digits.length === 4) lastRef.current?.blur();
                  }}
                  placeholder="0000"
                  maxLength={4}
                  className="flex-1 min-w-0 h-14 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] px-[var(--space-3)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-between h-14 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] px-[var(--space-5)]">
              <span className="text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)]">
                근로자 5인 이상
              </span>
              <button
                type="button"
                onClick={() => setIsOver5Employees((v) => !v)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  isOver5Employees
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-border-muted)]'
                }`}
              >
                <span
                  className={`absolute top-[3px] left-0 w-[22px] h-[22px] rounded-full bg-white shadow transition-transform duration-200 ${
                    isOver5Employees
                      ? 'translate-x-[23px]'
                      : 'translate-x-[3px]'
                  }`}
                />
              </button>
            </div>
          </section>
        </main>

        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-[600px] bg-[var(--color-bg-base)] px-[var(--space-5)] pt-[var(--space-4)]"
          style={{
            paddingBottom:
              'calc(var(--space-7) + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button
            type="button"
            onClick={handleRegister}
            disabled={isSubmitting}
            className="w-full h-14 rounded-[var(--radius-lg)] bg-[var(--color-primary)] shadow-[var(--shadow-card)] text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? isEditMode
                ? '수정 중...'
                : '등록 중...'
              : isEditMode
                ? '수정'
                : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
