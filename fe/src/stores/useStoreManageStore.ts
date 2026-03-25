import { create } from 'zustand';

export type RegisteredStore = {
  storeId: number;
  name: string;
  address: string;
  businessNumber: string;
  storeCode: string;
};

type RegisterStorePayload = {
  storeId?: number;
  name: string;
  address: string;
  businessNumber: string;
};

type StoreManageState = {
  registeredStore: RegisteredStore | null;
  registerStore: (payload: RegisterStorePayload) => void;
  clearRegisteredStore: () => void;
};

function createStoreCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createStoreId() {
  return Math.floor(1000 + Math.random() * 9000);
}

function withFallback(value: string, fallback: string) {
  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function createMockStoreCode() {
  return createStoreCode();
}

function createMockStoreId() {
  return createStoreId();
}

function buildRegisteredStore(
  previousStore: RegisteredStore | null,
  payload: RegisterStorePayload
): RegisteredStore {
  return {
    // API 응답값을 우선 사용하고, 없으면 기존/임시 값을 사용한다.
    storeId: payload.storeId ?? previousStore?.storeId ?? createMockStoreId(),
    // 빈 입력으로 등록해도 화면 확인이 가능하도록 기본값을 채운다.
    name: withFallback(payload.name, '싸피식당'),
    address: withFallback(payload.address, '주소 미입력'),
    businessNumber: withFallback(payload.businessNumber, '000-00-00000'),
    // 기존 코드가 있으면 유지해서 관리 화면에서 값이 갑자기 바뀌지 않게 한다.
    storeCode: previousStore?.storeCode ?? createMockStoreCode(),
  };
}

const useStoreManageStore = create<StoreManageState>((set) => ({
  // API 연동 전까지 등록 화면과 관리 화면을 연결하는 UI 임시 상태.
  registeredStore: null,
  registerStore: (payload) =>
    set((state) => ({
      registeredStore: buildRegisteredStore(state.registeredStore, payload),
    })),
  clearRegisteredStore: () => set({ registeredStore: null }),
}));

export default useStoreManageStore;
