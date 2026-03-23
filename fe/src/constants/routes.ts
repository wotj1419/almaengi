export const ROUTES = {
  LANDING: '/', // 스플래시(랜딩) 페이지 - 3초 후 로그인으로 이동
  LOGIN: '/login',
  SIGNUP: '/signup',
  SIGNUP_INFO: '/signup/info',
  SIGNUP_COMPLETE: '/signup/complete',
  HOME: '/home',
  SCHEDULE: '/schedule',
  // 직원 관리 메인 페이지 - 초대/승인/목록 관리
  EMPLOYEE: '/employee',
  // 직원 상세 정보 페이지 - 프로필 및 출근 통계 조회
  EMPLOYEE_DETAIL: '/employee/:employeeId',
  // 직원 근로계약서 페이지 (현재 준비 중 플레이스홀더)
  EMPLOYEE_CONTRACT: '/employee/:employeeId/contract',
  PAYROLL: '/payroll',
  STORE: '/store',
  // 매장 등록 진입 경로를 별도로 분리해 여러 화면에서 공통 사용한다.
  STORE_REGISTER: '/store/register',
  STORE_COMMUNITY: '/store/community',
  STORE_CHAT_NEW: '/store/community/chat/new',
  STORE_CHAT_ROOM: '/store/community/chat/:chatRoomId',
  STORE_BOARD_NEW: '/store/community/board/new',
  STORE_BOARD_DETAIL: '/store/community/board/:postId',
  TODO: '/todo',
  TODO_NEW: '/todo/new',
  TODO_DETAIL: '/todo/:id',
  TODO_EDIT: '/todo/:id/edit',
  AUCTION: '/auction',
  BOARD: '/board',
  ATTENDANCE: '/attendance',
  CHATBOT: '/chatbot',
  REPORT: '/report',
  NOTIFICATION: '/notification',
} as const;
