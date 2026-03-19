import { Routes, Route } from 'react-router-dom';
import AuctionLayout from '@/features/auction/layouts/AuctionLayout';
import { ROUTES } from '@/constants/routes';
import HomePage from '@/features/home/pages/HomePage';
import SchedulePage from '@/features/schedule/pages/SchedulePage';
import EmployeePage from '@/features/employee/pages/EmployeePage';
import PayrollPage from '@/features/payroll/pages/PayrollPage';
import StorePage from '@/features/store/pages/StorePage';
import TodoPage from '@/features/todo/pages/TodoPage';
import TodoRegisterPage from '@/features/todo/pages/TodoRegisterPage';
import TodoDetailPage from '@/features/todo/pages/TodoDetailPage';
import TodoEditPage from '@/features/todo/pages/TodoEditPage';
import AuctionPage from '@/features/auction/pages/AuctionPage';
import AuctionDetailPage from '@/features/auction/pages/AuctionDetailPage';
import AuctionRegisterPage from '@/features/auction/pages/AuctionRegisterPage';
import AuctionEditPage from '@/features/auction/pages/AuctionEditPage';
import AuctionResultPage from '@/features/auction/pages/AuctionResultPage';
import BoardPage from '@/features/board/pages/BoardPage';
import AttendancePage from '@/features/attendance/pages/AttendancePage';
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
  return (
    <Routes>
      {/* 스플래시(랜딩) 페이지 - 앱 최초 진입 시 표시 */}
      <Route path={ROUTES.LANDING} element={<LandingPage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.SIGNUP} element={<RoleSelectPage />} />
      <Route path={ROUTES.SIGNUP_INFO} element={<SignupPage />} />
      <Route path={ROUTES.SIGNUP_COMPLETE} element={<SignupCompletePage />} />
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.SCHEDULE} element={<SchedulePage />} />
      <Route path={ROUTES.EMPLOYEE} element={<EmployeePage />} />
      <Route path={ROUTES.PAYROLL} element={<PayrollPage />} />
      <Route path={ROUTES.STORE} element={<StorePage />} />
      <Route path={ROUTES.TODO} element={<TodoPage />} />
      <Route element={<AuctionLayout />}>
        <Route path={ROUTES.AUCTION} element={<AuctionPage />} />
        <Route path="/auction/register" element={<AuctionRegisterPage />} />
        <Route path="/auction/edit/:id" element={<AuctionEditPage />} />
        <Route path="/auction/result/:id" element={<AuctionResultPage />} />
        <Route path="/auction/:id" element={<AuctionDetailPage />} />
      </Route>
      <Route path={ROUTES.TODO_NEW} element={<TodoRegisterPage />} />
      <Route path={ROUTES.TODO_DETAIL} element={<TodoDetailPage />} />
      <Route path={ROUTES.TODO_EDIT} element={<TodoEditPage />} />
      <Route path={ROUTES.AUCTION} element={<AuctionPage />} />
      <Route path={ROUTES.BOARD} element={<BoardPage />} />
      <Route path={ROUTES.ATTENDANCE} element={<AttendancePage />} />
      <Route path={ROUTES.CHATBOT} element={<ChatbotPage />} />
      <Route path={ROUTES.REPORT} element={<ReportPage />} />
      <Route path={ROUTES.NOTIFICATION} element={<NotificationPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
