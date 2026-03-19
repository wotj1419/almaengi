import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import DatePickerModal from '@/components/common/DateSheet';
import TimePickerModal from '@/components/common/TimeSheet';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { getApiErrorMessage } from '@/api/error';
import useAuthStore from '@/stores/useAuthStore';
import AuctionSettingsCard from '../components/AuctionSettingsCard';
import WorkInfoCard from '../components/WorkInfoCard';
import { useCreateAuction } from '../hooks/useAuctionQueries';
import { formatTime } from '../utils/formatTime';

export default function AuctionRegisterPage() {
  // 로그인한 사용자의 매장 ID (미로그인 시 기본값 1)
  const storeId = useAuthStore((state) => state.user?.storeId ?? 1);
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(18);
  const [endMinute, setEndMinute] = useState(0);
  const [timePickerTarget, setTimePickerTarget] = useState<
    'start' | 'end' | null
  >(null);

  const [staffCount, setStaffCount] = useState('1');
  const [staffCountError, setStaffCountError] = useState(false);
  const [minWage, setMinWage] = useState('10,320');
  const [maxWage, setMaxWage] = useState('12,384');

  const [deadlineDate, setDeadlineDate] = useState(dayjs());
  const [deadlineHour, setDeadlineHour] = useState(18);
  const [deadlineMinute, setDeadlineMinute] = useState(0);
  const [deadlineStep, setDeadlineStep] = useState<'date' | 'time' | null>(
    null
  );

  const createMutation = useCreateAuction();

  const handleCancel = () => {
    navigate(-1);
  };

  const handleStaffCountChange = (value: string) => {
    setStaffCount(value);
    setStaffCountError(false);
  };

  const handleSubmit = () => {
    if (!staffCount || Number(staffCount) <= 0) {
      setStaffCountError(true);
      return;
    }

    const now = dayjs();
    const targetStart = selectedDate
      .hour(startHour)
      .minute(startMinute)
      .second(0);
    const targetEnd = selectedDate.hour(endHour).minute(endMinute).second(0);
    const deadline = deadlineDate
      .hour(deadlineHour)
      .minute(deadlineMinute)
      .second(0);

    if (targetStart.isBefore(now)) {
      toast.error('근무 시작 시간은 현재 이후여야 합니다.');
      return;
    }

    if (targetEnd.isBefore(targetStart)) {
      toast.error('근무 종료 시간은 시작 시간 이후여야 합니다.');
      return;
    }

    if (!deadline.isAfter(now)) {
      toast.error('경매 마감 시간은 현재 이후여야 합니다.');
      return;
    }

    if (!deadline.isBefore(targetStart)) {
      toast.error('경매 마감 시간은 근무 시작 전이어야 합니다.');
      return;
    }

    createMutation.mutate(
      {
        storeId: storeId,
        body: {
          targetDate: selectedDate.format('YYYY-MM-DD'),
          targetStartTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`,
          targetEndTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`,
          deadline: deadline.format('YYYY-MM-DDTHH:mm:ss'),
          minWage: Number(minWage.replace(/,/g, '')),
          maxWage: Number(maxWage.replace(/,/g, '')),
          recruitCount: Number(staffCount),
        },
      },
      {
        onSuccess: () => {
          toast.success('경매가 등록되었습니다.');
          navigate('/auction');
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, '경매 등록에 실패했습니다.'));
        },
      }
    );
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-body)]">
      <Header title="새 경매 등록" onBack={handleCancel} auctionStyle />

      <main className="px-[15px] pt-[20px] pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col gap-[15px]">
        <WorkInfoCard
          date={selectedDate.format('YYYY. MM. DD')}
          staffCount={staffCount}
          startTime={formatTime(startHour, startMinute)}
          endTime={formatTime(endHour, endMinute)}
          onDateClick={() => setIsDatePickerOpen(true)}
          onStartTimeClick={() => setTimePickerTarget('start')}
          onEndTimeClick={() => setTimePickerTarget('end')}
          onStaffCountChange={handleStaffCountChange}
          staffCountError={staffCountError}
        />
        <AuctionSettingsCard
          minWage={minWage}
          maxWage={maxWage}
          deadline={`${deadlineDate.format('YYYY. MM. DD')}  ${formatTime(deadlineHour, deadlineMinute)}`}
          onMinWageChange={setMinWage}
          onMaxWageChange={setMaxWage}
          onDeadlineClick={() => setDeadlineStep('date')}
        />

        <div className="self-stretch inline-flex justify-center items-center gap-3.5">
          <button
            onClick={handleCancel}
            className="flex-1 h-12 bg-[var(--color-bg-surface)] rounded-xl flex justify-center items-center"
          >
            <span className="text-[var(--color-text-muted)] text-lg font-bold leading-5">
              취소
            </span>
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 h-12 bg-[var(--color-primary)] rounded-xl flex justify-center items-center"
          >
            <span className="text-[var(--color-text-primary)] text-lg font-bold leading-5">
              경매 등록
            </span>
          </button>
        </div>
      </main>

      <BottomNav activeTab="schedule" />

      <DatePickerModal
        isOpen={isDatePickerOpen || deadlineStep === 'date'}
        selectedDate={deadlineStep === 'date' ? deadlineDate : selectedDate}
        onConfirm={(date) => {
          if (deadlineStep === 'date') {
            setDeadlineDate(date);
            setDeadlineStep('time');
            return;
          }

          setSelectedDate(date);
          setIsDatePickerOpen(false);
        }}
        onClose={() => {
          if (deadlineStep === 'date') {
            setDeadlineStep(null);
            return;
          }

          setIsDatePickerOpen(false);
        }}
      />

      <TimePickerModal
        key={`${timePickerTarget}-${deadlineStep}`}
        isOpen={timePickerTarget !== null || deadlineStep === 'time'}
        selectedHour={
          deadlineStep === 'time'
            ? deadlineHour
            : timePickerTarget === 'end'
              ? endHour
              : startHour
        }
        selectedMinute={
          deadlineStep === 'time'
            ? deadlineMinute
            : timePickerTarget === 'end'
              ? endMinute
              : startMinute
        }
        onConfirm={(hour, minute) => {
          if (deadlineStep === 'time') {
            setDeadlineHour(hour);
            setDeadlineMinute(minute);
            setDeadlineStep(null);
            return;
          }

          if (timePickerTarget === 'start') {
            setStartHour(hour);
            setStartMinute(minute);
            setTimePickerTarget(null);
            return;
          }

          setEndHour(hour);
          setEndMinute(minute);
          setTimePickerTarget(null);
        }}
        onClose={() => {
          if (deadlineStep === 'time') {
            setDeadlineStep(null);
            return;
          }

          setTimePickerTarget(null);
        }}
      />
    </div>
  );
}
