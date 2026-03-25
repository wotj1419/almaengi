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
import PayrollPage from '@/features/payroll/pages/PayrollPage';
import {
  ContractDetailPage,
  ContractRequestPage,
  DocumentsHomePage,
  EmployeeContractSignPage,
  EmployeeDocumentsPage,
  EmployeePayslipDetailPage,
  EtcDocumentRequestPage,
  MyDocumentsPage,
  PayslipDetailPage,
} from '@/features/documents';
import StoreManagePage from '@/features/store/pages/StoreManagePage';
import StoreRegisterPage from '@/features/store/pages/StoreRegisterPage';
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
import NotificationPage from '@/features/notification/pages/NotificationPage';
import LandingPage from '@/features/landing/pages/LandingPage';
import LoginPage from '@/features/login/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import RoleSelectPage from '@/features/login/pages/RoleSelectPage';
import SignupPage from '@/features/login/pages/SignupPage';
import SignupCompletePage from '@/features/login/pages/SignupCompletePage';

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
      <Route path={ROUTES.PAYROLL} element={<PayrollPage />} />
      <Route path={ROUTES.DOCUMENTS} element={<DocumentsHomePage />} />
      <Route path={ROUTES.DOCUMENTS_MY} element={<MyDocumentsPage />} />
      <Route
        path={ROUTES.DOCUMENTS_REQUEST}
        element={<ContractRequestPage />}
      />
      <Route
        path={ROUTES.DOCUMENTS_REQUEST_ETC}
        element={<EtcDocumentRequestPage />}
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
            <Navigate replace to={ROUTES.DOCUMENTS} />
          )
        }
      />
      <Route
        path={ROUTES.WORKER_DOCUMENTS_PAYSLIP_DETAIL}
        element={<EmployeePayslipDetailPage />}
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
        {/* owner 전용 경매 routes */}
        {role === 'OWNER' && (
          <>
            <Route path="/auction/register" element={<AuctionRegisterPage />} />
            <Route path="/auction/edit/:id" element={<AuctionEditPage />} />
            <Route path="/auction/result/:id" element={<AuctionResultPage />} />
          </>
        )}
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
      <Route path={ROUTES.REPORT} element={<ReportPage />} />
      <Route path={ROUTES.NOTIFICATION} element={<NotificationPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
