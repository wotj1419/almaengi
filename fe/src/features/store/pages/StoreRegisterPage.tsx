import { MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/common/DetailHeader';
import useAuthStore from '@/stores/useAuthStore';
import useStoreManageStore from '@/stores/useStoreManageStore';

const LABEL_CLASS =
  'px-[var(--space-1)] pb-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[var(--color-text-secondary)] leading-5';

const INPUT_BASE_CLASS =
  'w-full h-14 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] px-[var(--space-5)] text-[length:var(--text-md2)] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] outline-none';

export default function StoreRegisterPage() {
  const navigate = useNavigate();
  // 이미 등록된 값이 있으면 수정 화면처럼 초기값으로 보여준다.
  const registeredStore = useStoreManageStore((state) => state.registeredStore);
  const registerStore = useStoreManageStore((state) => state.registerStore);
  const setActiveStoreId = useAuthStore((state) => state.setActiveStoreId);

  const [storeName, setStoreName] = useState(registeredStore?.name ?? '');
  const [address, setAddress] = useState(registeredStore?.address ?? '');
  const [businessNumber, setBusinessNumber] = useState(
    registeredStore?.businessNumber ?? ''
  );

  const syncActiveStoreIdAfterRegister = () => {
    const registeredStoreFromState =
      useStoreManageStore.getState().registeredStore;
    setActiveStoreId(registeredStoreFromState?.storeId ?? null);
  };

  const handleRegister = () => {
    // 현재 단계는 UI 우선이므로 저장 대신 로컬 스토어에 즉시 반영한다.
    registerStore({
      name: storeName,
      address,
      businessNumber,
    });

    // 경매 페이지 접근 제어(activeStoreId)와 등록 결과를 즉시 동기화한다.
    syncActiveStoreIdAfterRegister();
    navigate(ROUTES.STORE);
  };

  return (
    <div className="flex justify-center bg-[var(--color-bg-base)] min-h-screen">
      <div className="w-full md:max-w-[600px] min-h-screen flex flex-col bg-[var(--color-bg-base)]">
        <DetailHeader
          title="새 매장 등록"
          onBack={() => navigate(ROUTES.STORE)}
        />

        <main className="flex-1 px-[var(--space-5)] pt-[var(--space-7)] pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
          <section className="flex flex-col gap-[var(--space-2)]">
            <h1 className="text-[length:var(--text-2xl)] font-medium text-[var(--color-text-primary)] leading-8">
              운영하시는 매장의
              <br />
              정보를 입력해 주세요
            </h1>
          </section>

          <section className="mt-[var(--space-8)] flex flex-col gap-[var(--space-4)]">
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
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="주소 검색"
                  className={`${INPUT_BASE_CLASS} pl-12`}
                />
              </div>

              <div className="mt-[var(--space-4)] h-32 rounded-[var(--radius-lg)] border border-[var(--color-input-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-form-card)] flex items-center justify-center">
                <div className="inline-flex items-center gap-[var(--space-2)] text-[var(--color-text-muted)]">
                  <MapPin size={18} strokeWidth={2} />
                  <span className="text-[length:var(--text-sm)] font-medium">
                    지도 미리보기 준비 중
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className={LABEL_CLASS}>사업자 번호</label>
              <input
                type="text"
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value)}
                placeholder="000-00-00000"
                className={INPUT_BASE_CLASS}
              />
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
            className="w-full h-14 rounded-[var(--radius-lg)] bg-[var(--color-primary)] shadow-[var(--shadow-card)] text-[length:var(--text-md2)] font-bold text-[var(--color-text-primary)] cursor-pointer"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
