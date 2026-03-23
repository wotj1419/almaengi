// 사장님이 발급하는 직원 초대 코드 타입
export interface OwnerInviteCode {
  storeName: string;
  code: string;
  expiresAt: string;
}

// 매장 관리 스토어에 코드가 없을 때 사용하는 fallback mock 초대 코드 (유효기간 24시간)
export const ownerInviteCodeMock: OwnerInviteCode = {
  storeName: '싸피식당',
  // 매장 관리에서 가져오는 6자리 코드가 없을 때만 사용하는 fallback 코드
  code: '438217',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};
