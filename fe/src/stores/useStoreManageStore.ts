import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── RegisteredStore 타입 ───────────────────────────────────────────────
// [변경] API DTO(StoreResponseDto.StoreInfo) 필드와 일치하도록 확장
//        기존 필드: storeId, name, address, businessNumber, storeCode
//        신규 추가: phone (전화번호), isOver5Employees (5인 이상 여부)
//        변경 사항: storeCode 의미 재정의 → API 응답 qrCode(UUID 직원 초대코드) 저장
export type RegisteredStore = {
  storeId: number;
  name: string; // ← API storeName (매장명)
  address: string; // ← API address (매장 주소)
  businessNumber: string; // UI 전용 (API 미전송, localStorage 보관)
  storeCode: string; // ← API qrCode (UUID 형태 직원 초대코드)
  phone: string | null; // ← API phone (전화번호)
  isOver5Employees: boolean; // ← API isOver5Employees (5인 이상 여부)
};

// ─── RegisterStorePayload 타입 ──────────────────────────────────────────
// [변경] API 응답 필드를 모두 수용할 수 있도록 필드 추가
//        모든 필드를 required 로 변경 (API 응답은 항상 모든 필드를 제공)
type RegisterStorePayload = {
  storeId: number;
  name: string;
  address: string;
  businessNumber: string;
  storeCode: string; // API qrCode 값
  phone: string | null;
  isOver5Employees: boolean;
};

type StoreManageState = {
  registeredStore: RegisteredStore | null;
  registerStore: (payload: RegisterStorePayload) => void;
  clearRegisteredStore: () => void;
};

// ─── buildRegisteredStore ───────────────────────────────────────────────
// [변경] 기존의 fallback 값 제거 + 임시 ID/코드 생성 로직 제거
//        API 응답값을 그대로 저장 (검증은 StoreRegisterPage에서 담당)
//        fallback을 여기서 제거한 이유:
//        - 빈 입력이 API에 도달하면 '싸피식당'/'주소 미입력'으로 가짜 매장이 등록됨
//        - 검증을 StoreRegisterPage에서 필터링하면 여기 도달 시 값이 항상 유효함
function buildRegisteredStore(payload: RegisterStorePayload): RegisteredStore {
  return {
    storeId: payload.storeId,
    name: payload.name,
    address: payload.address,
    businessNumber: payload.businessNumber,
    storeCode: payload.storeCode,
    phone: payload.phone,
    isOver5Employees: payload.isOver5Employees,
  };
}

const useStoreManageStore = create<StoreManageState>()(
  // ─── persist 미들웨어 추가 ─────────────────────────────────────────
  // [변경 이유]
  // 기존: plain create() → registeredStore는 메모리에만 보관
  //      페이지 새로고침 시 null로 초기화 → StoreManagePage 진입 시 "매장 없음" 화면
  // 변경: persist() 래핑 → registeredStore를 localStorage에 직렬화 저장
  //      새로고침 후 localStorage 에서 자동 복원
  persist(
    (set) => ({
      registeredStore: null,
      registerStore: (payload) =>
        set(() => ({
          registeredStore: buildRegisteredStore(payload),
        })),
      clearRegisteredStore: () => set({ registeredStore: null }),
    }),
    { name: 'store-manage-storage' } // localStorage 키 이름
  )
);

export default useStoreManageStore;
