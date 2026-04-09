import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/common/DetailHeader';
import ConfirmModal from '@/components/common/ConfirmModal';
import { getApiErrorMessage } from '@/api/error';
import { createStore, updateStore } from '@/api/store';
import type { StoreInfo } from '@/api/store';
import useAuthStore from '@/stores/useAuthStore';
import useStoreStore from '@/stores/useStoreStore';
import { useKakaoMap } from '../hooks/useKakaoMap';
import KakaoMapPreview from '../components/KakaoMapPreview';
import PhoneInput from '../components/PhoneInput';

const LABEL_CLASS =
  'px-[var(--space-1)] pb-[var(--space-2)] text-[length:var(--text-md)] font-bold text-[var(--color-text-secondary)] leading-5';

const INPUT_BASE_CLASS =
  'w-full h-14 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none';

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
  const isAddMode = location.state?.mode === 'add';

  const currentStore = useStoreStore((s) => s.currentStore);
  const setStores = useStoreStore((s) => s.setStores);
  const selectStore = useStoreStore((s) => s.selectStore);
  const setActiveStoreId = useAuthStore((state) => state.setActiveStoreId);

  const initialPhone = parsePhone(
    isEditMode ? (currentStore?.phone ?? null) : null
  );

  const [storeName, setStoreName] = useState(
    isEditMode ? (currentStore?.storeName ?? '') : ''
  );
  const [address, setAddress] = useState(
    isEditMode ? (currentStore?.address ?? '') : ''
  );
  const [phonePrefix, setPhonePrefix] = useState(initialPhone.prefix);
  const [phoneMid, setPhoneMid] = useState(initialPhone.mid);
  const [phoneLast, setPhoneLast] = useState(initialPhone.last);
  const [isOver5Employees, setIsOver5Employees] = useState(
    isEditMode ? (currentStore?.isOver5Employees ?? false) : false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNavigateDialog, setShowNavigateDialog] = useState(false);
  const [newlyCreatedStore, setNewlyCreatedStore] = useState<StoreInfo | null>(
    null
  );

  const { mapContainerRef, mapCoords, openAddressSearch } = useKakaoMap(
    isEditMode ? (currentStore?.address ?? undefined) : undefined
  );

  const handleAddressSearch = () => {
    openAddressSearch((selected) => setAddress(selected));
  };

  const handleRegister = async () => {
    if (isSubmitting) return;

    if (!storeName.trim()) {
      toast.error('매장명을 입력해 주세요.');
      return;
    }
    if (!address.trim()) {
      toast.error('매장 주소를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    const resolvedPhone =
      phoneMid && phoneLast ? `${phonePrefix}-${phoneMid}-${phoneLast}` : null;

    try {
      if (isEditMode && currentStore) {
        const updatedStore = await updateStore(currentStore.storeId, {
          storeName: storeName.trim(),
          address: address.trim(),
          phone: resolvedPhone,
          isOver5Employees,
        });
        setStores([updatedStore]);
        navigate(ROUTES.STORE);
      } else if (isAddMode) {
        const createdStore = await createStore({
          storeName: storeName.trim(),
          address: address.trim(),
          phone: resolvedPhone,
          isOver5Employees,
        });
        setNewlyCreatedStore(createdStore);
        setShowNavigateDialog(true);
      } else {
        const createdStore = await createStore({
          storeName: storeName.trim(),
          address: address.trim(),
          phone: resolvedPhone,
          isOver5Employees,
        });
        setStores([createdStore]);
        setActiveStoreId(createdStore.storeId);
        navigate(ROUTES.STORE);
      }
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

  const handleDialogCancel = () => {
    setShowNavigateDialog(false);
    navigate(ROUTES.STORE);
  };

  const handleDialogConfirm = () => {
    if (!newlyCreatedStore) return;
    selectStore(newlyCreatedStore);
    setActiveStoreId(newlyCreatedStore.storeId);
    setShowNavigateDialog(false);
    navigate(ROUTES.HOME);
  };

  return (
    <div className="bg-[var(--color-bg-base)] min-h-screen">
      <div className="w-full max-w-[var(--max-w-app)] mx-auto min-h-screen flex flex-col bg-[var(--color-bg-base)]">
        <DetailHeader
          title={
            isEditMode
              ? '매장 정보 수정'
              : isAddMode
                ? '추가 매장 등록'
                : '새 매장 등록'
          }
          onBack={() => navigate(-1)}
        />

        <main className="flex-1 px-[var(--space-5)] pt-[var(--space-7)] pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
          <section className="flex flex-col gap-[var(--space-4)]">
            <div className="flex flex-col">
              <label className={LABEL_CLASS}>매장명</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="예: 알바천국 카페 강남점"
                className={INPUT_BASE_CLASS}
              />
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
                  onClick={handleAddressSearch}
                  placeholder="주소 검색"
                  className={`${INPUT_BASE_CLASS} pl-12 cursor-pointer`}
                />
              </div>
              <KakaoMapPreview
                mapContainerRef={mapContainerRef}
                hasCoords={!!mapCoords}
              />
            </div>

            <div className="flex flex-col mt-[var(--space-4)]">
              <label className={LABEL_CLASS}>연락처 (선택)</label>
              <PhoneInput
                prefix={phonePrefix}
                mid={phoneMid}
                last={phoneLast}
                onPrefixChange={setPhonePrefix}
                onMidChange={setPhoneMid}
                onLastChange={setPhoneLast}
              />
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
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--max-w-app)] bg-[var(--color-bg-base)] px-[var(--space-5)] pt-[var(--space-4)]"
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

      <ConfirmModal
        isOpen={showNavigateDialog}
        message={'새로운 매장의 홈으로\n이동하시겠습니까?'}
        confirmText="이동"
        cancelText="취소"
        onConfirm={handleDialogConfirm}
        onClose={handleDialogCancel}
      />
    </div>
  );
}
