import { Routes, Route } from 'react-router-dom';
import AuctionLayout from '@/features/auction/layouts/AuctionLayout';
import { ROUTES } from '@/constants/routes';
import HomePage from '@/features/home/pages/HomePage';
import SchedulePage from '@/features/schedule/pages/SchedulePage';
import EmployeePage from '@/features/employee/pages/EmployeePage';
import PayrollPage from '@/features/payroll/pages/PayrollPage';
import StorePage from '@/features/store/pages/StorePage';
import TodoPage from '@/features/todo/pages/TodoPage';
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
import NotFoundPage from '@/pages/NotFoundPage';

export default function AppRouter() {
  return (
    <Routes>
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
      <Route path={ROUTES.BOARD} element={<BoardPage />} />
      <Route path={ROUTES.ATTENDANCE} element={<AttendancePage />} />
      <Route path={ROUTES.CHATBOT} element={<ChatbotPage />} />
      <Route path={ROUTES.REPORT} element={<ReportPage />} />
      <Route path={ROUTES.NOTIFICATION} element={<NotificationPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
