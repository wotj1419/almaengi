import { create } from 'zustand';

export type RegisteredStore = {
  name: string;
  address: string;
  businessNumber: string;
  storeCode: string;
};

type RegisterStorePayload = {
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

const useStoreManageStore = create<StoreManageState>((set) => ({
  // API 연동 전까지 등록 화면과 관리 화면을 연결하는 UI 임시 상태.
  registeredStore: null,
  registerStore: (payload) =>
    set((state) => ({
      registeredStore: {
        // 빈 입력으로 등록해도 화면 확인이 가능하도록 기본값을 채운다.
        name: payload.name.trim() || '\uC2F8\uD53C\uC2DD\uB2F9',
        address: payload.address.trim() || '\uC8FC\uC18C \uBBF8\uC785\uB825',
        businessNumber: payload.businessNumber.trim() || '000-00-00000',
        // 기존 코드가 있으면 유지해서 관리 화면에서 값이 갑자기 바뀌지 않게 한다.
        storeCode: state.registeredStore?.storeCode ?? createStoreCode(),
      },
    })),
  clearRegisteredStore: () => set({ registeredStore: null }),
}));

export default useStoreManageStore;
