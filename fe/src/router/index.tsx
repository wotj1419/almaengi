import { Navigate, Route, Routes } from 'react-router-dom';
import AuctionLayout from '@/features/auction/layouts/AuctionLayout';
import { ROUTES } from '@/constants/routes';
import useAuthStore from '@/stores/useAuthStore';
import HomePage from '@/features/home/pages/HomePage';
import EmployeeHomePage from '@/features/home/pages/EmployeeHomePage';
import SchedulePage from '@/features/schedule/pages/SchedulePage';
import EmployeePage from '@/features/employee/pages/EmployeePage';
import EmployeeDetailPage from '@/features/employee/pages/EmployeeDetailPage';
import EmployeeContractPage from '@/features/employee/pages/EmployeeContractPage';
import { PayrollPage, EmployeePayrollPage } from '@/features/payroll';
import {
  ContractDetailPage,
  ContractRequestPage,
  EmployeeContractSignPage,
  EmployeeDocumentsPage,
  EmployeePayslipDetailPage,
  MyDocumentsPage,
  PayslipDetailPage,
} from '@/features/documents';
import StoreManagePage from '@/features/store/pages/StoreManagePage';
import StoreRegisterPage from '@/features/store/pages/StoreRegisterPage';
import StoreJoinPage from '@/features/store/pages/StoreJoinPage';
import StoreJoinPendingPage from '@/features/store/pages/StoreJoinPendingPage';
import StorePage from '@/features/store/pages/StorePage';
import QrManagePage from '@/features/store/pages/QrManagePage';
import NewChatPage from '@/features/store/pages/NewChatPage';
import ChatRoomPage from '@/features/store/pages/ChatRoomPage';
import NewPostPage from '@/features/store/pages/NewPostPage';
import PostDetailPage from '@/features/store/pages/PostDetailPage';
import TodoPage from '@/features/todo/pages/TodoPage';
import TodoRegisterPage from '@/features/todo/pages/TodoRegisterPage';
import TodoDetailPage from '@/features/todo/pages/TodoDetailPage';
import TodoEditPage from '@/features/todo/pages/TodoEditPage';
import AuctionPage from '@/features/auction/pages/AuctionPage';
import AuctionDetailPage from '@/features/auction/pages/AuctionDetailPage';
import AuctionRegisterPage from '@/features/auction/pages/AuctionRegisterPage';
import AuctionEditPage from '@/features/auction/pages/AuctionEditPage';
import AuctionResultPage from '@/features/auction/pages/AuctionResultPage';
import EmployeeAuctionPage from '@/features/auction/pages/EmployeeAuctionPage';
import EmployeeAuctionDetailPage from '@/features/auction/pages/EmployeeAuctionDetailPage';
import BoardPage from '@/features/board/pages/BoardPage';
import AttendancePage from '@/features/attendance/pages/AttendancePage';
import AttendanceCheckPage from '@/features/attendance/pages/AttendanceCheckPage';
import ChatbotPage from '@/features/chatbot/pages/ChatbotPage';
import ReportPage from '@/features/report/pages/ReportPage';
import EmployeeReportPage from '@/features/report/pages/EmployeeReportPage';
import NotificationPage from '@/features/notification/pages/NotificationPage';
import LandingPage from '@/features/landing/pages/LandingPage';
import LoginPage from '@/features/login/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import RoleSelectPage from '@/features/login/pages/RoleSelectPage';
import SignupPage from '@/features/login/pages/SignupPage';
import SignupCompletePage from '@/features/login/pages/SignupCompletePage';
import DemoEntryPage from '@/demo/pages/DemoEntryPage';

export default function AppRouter() {
  const role = useAuthStore((state) => state.user?.role);

  return (
    <Routes>
      {/* 스플래시(랜딩) 페이지 - 앱 최초 진입 시 표시 */}
      <Route path={ROUTES.LANDING} element={<LandingPage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.SIGNUP} element={<RoleSelectPage />} />
      <Route path={ROUTES.SIGNUP_INFO} element={<SignupPage />} />
      <Route path={ROUTES.SIGNUP_COMPLETE} element={<SignupCompletePage />} />
      <Route
        path={ROUTES.HOME}
        element={role === 'OWNER' ? <HomePage /> : <EmployeeHomePage />}
      />
      <Route path={ROUTES.SCHEDULE} element={<SchedulePage />} />
      {/* 직원 관리: 목록 → 상세 → 근로계약서 순으로 depth가 깊어진다 */}
      <Route path={ROUTES.EMPLOYEE} element={<EmployeePage />} />
      <Route path={ROUTES.EMPLOYEE_DETAIL} element={<EmployeeDetailPage />} />
      <Route
        path={ROUTES.EMPLOYEE_CONTRACT}
        element={<EmployeeContractPage />}
      />
      {/* 급여 페이지 — 역할별 분기 */}
      <Route
        path={ROUTES.PAYROLL}
        element={role === 'OWNER' ? <PayrollPage /> : <EmployeePayrollPage />}
      />
      <Route
        path={ROUTES.DOCUMENTS}
        element={<Navigate replace to={ROUTES.DOCUMENTS_MY} />}
      />
      <Route path={ROUTES.DOCUMENTS_MY} element={<MyDocumentsPage />} />
      <Route
        path={ROUTES.DOCUMENTS_REQUEST}
        element={<ContractRequestPage />}
      />
      <Route
        path={ROUTES.DOCUMENTS_PAYSLIP_DETAIL}
        element={<PayslipDetailPage />}
      />
      <Route
        path={ROUTES.DOCUMENTS_CONTRACT_DETAIL}
        element={<ContractDetailPage />}
      />
      <Route
        path={ROUTES.WORKER_DOCUMENTS}
        element={
          role === 'EMPLOYEE' ? (
            <EmployeeDocumentsPage />
          ) : (
            <Navigate replace to={ROUTES.DOCUMENTS_MY} />
          )
        }
      />
      <Route
        path={ROUTES.WORKER_DOCUMENTS_PAYSLIP_DETAIL}
        element={
          role === 'EMPLOYEE' ? (
            <EmployeePayslipDetailPage />
          ) : (
            <Navigate replace to={ROUTES.DOCUMENTS_MY} />
          )
        }
      />
      <Route
        path={ROUTES.WORKER_DOCUMENTS_CONTRACT_SIGN}
        element={<EmployeeContractSignPage />}
      />
      <Route
        path="/documents/my"
        element={<Navigate replace to={ROUTES.DOCUMENTS_MY} />}
      />
      <Route path={ROUTES.STORE} element={<StoreManagePage />} />
      {/* 매장 관리/경매 빈 상태에서 공통으로 진입하는 등록 페이지 */}
      <Route path={ROUTES.STORE_REGISTER} element={<StoreRegisterPage />} />
      <Route path={ROUTES.STORE_JOIN} element={<StoreJoinPage />} />
      <Route
        path={ROUTES.STORE_JOIN_PENDING}
        element={<StoreJoinPendingPage />}
      />
      <Route path={ROUTES.STORE_QR} element={<QrManagePage />} />
      <Route path={ROUTES.STORE_COMMUNITY} element={<StorePage />} />
      <Route path={ROUTES.STORE_CHAT_NEW} element={<NewChatPage />} />
      <Route path={ROUTES.STORE_CHAT_ROOM} element={<ChatRoomPage />} />
      <Route path={ROUTES.STORE_BOARD_NEW} element={<NewPostPage />} />
      <Route path={ROUTES.STORE_BOARD_DETAIL} element={<PostDetailPage />} />
      <Route path={ROUTES.TODO} element={<TodoPage />} />
      <Route element={<AuctionLayout />}>
        <Route
          path={ROUTES.AUCTION}
          element={role === 'OWNER' ? <AuctionPage /> : <EmployeeAuctionPage />}
        />
        {/*
          ─── owner 전용 경매 라우트 ────────────────────────────────────────
          [문제] 기존 코드는 role === 'OWNER'일 때만 이 라우트들을 등록했음.
                 → EMPLOYEE가 /auction/register에 접근하면 이 라우트가 없으므로
                   React Router가 아래의 /auction/:id로 폴백하여
                   'register'가 :id 파라미터로 인식됨.
                   결과: EMPLOYEE도 등록 페이지에 접근 가능한 버그 발생.

          [해결] 세 라우트를 항상 등록해 /auction/:id보다 먼저 선언되도록 유지.
                 각 라우트에서 역할 확인:
                 - OWNER  → 해당 페이지 렌더링
                 - 그 외  → /auction으로 리다이렉트 (접근 차단)
          ─────────────────────────────────────────────────────────────────── */}
        <Route
          path="/auction/register"
          element={
            role === 'OWNER' ? (
              <AuctionRegisterPage />
            ) : (
              <Navigate replace to={ROUTES.AUCTION} />
            )
          }
        />
        <Route
          path="/auction/edit/:id"
          element={
            role === 'OWNER' ? (
              <AuctionEditPage />
            ) : (
              <Navigate replace to={ROUTES.AUCTION} />
            )
          }
        />
        <Route
          path="/auction/result/:id"
          element={
            role === 'OWNER' ? (
              <AuctionResultPage />
            ) : (
              <Navigate replace to={ROUTES.AUCTION} />
            )
          }
        />
        <Route
          path="/auction/:id"
          element={
            role === 'OWNER' ? (
              <AuctionDetailPage />
            ) : (
              <EmployeeAuctionDetailPage />
            )
          }
        />
      </Route>
      <Route path={ROUTES.TODO_NEW} element={<TodoRegisterPage />} />
      <Route path={ROUTES.TODO_DETAIL} element={<TodoDetailPage />} />
      <Route path={ROUTES.TODO_EDIT} element={<TodoEditPage />} />
      <Route path={ROUTES.BOARD} element={<BoardPage />} />
      <Route path={ROUTES.ATTENDANCE} element={<AttendancePage />} />
      <Route path={ROUTES.ATTENDANCE_CHECK} element={<AttendanceCheckPage />} />
      <Route path={ROUTES.CHATBOT} element={<ChatbotPage />} />
      <Route
        path={ROUTES.REPORT}
        element={role === 'OWNER' ? <ReportPage /> : <EmployeeReportPage />}
      />
      <Route path={ROUTES.NOTIFICATION} element={<NotificationPage />} />
      <Route path="/demo/:role" element={<DemoEntryPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
