// 브라우저가 Notification API를 지원하는지 확인합니다.
// (지원하지 않으면 권한 요청 자체가 불가능)
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}
// 알림 권한 상태를 확인하고 필요 시 요청합니다.
// 반환값: 'granted' | 'denied' | 'default'
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    // 지원하지 않는 환경은 사실상 denied 취급
    return 'denied';
  }
  // 이미 허용된 상태면 즉시 반환
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  // 아직 선택 전(default) 상태면 사용자에게 권한 팝업 요청
  if (Notification.permission === 'default') {
    return Notification.requestPermission();
  }
  // denied 상태면 그대로 반환 (재요청 루프 방지)
  return Notification.permission;
}