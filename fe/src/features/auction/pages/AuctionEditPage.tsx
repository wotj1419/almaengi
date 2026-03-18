import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DatePickerModal from '@/components/common/DateSheet';
import TimePickerModal from '@/components/common/TimeSheet';
import WorkInfoCard from '../components/WorkInfoCard';
import AuctionSettingsCard from '../components/AuctionSettingsCard';
import { useAuctionDetail, useUpdateAuction } from '../hooks/useAuctionQueries';
import { formatTime, parseTimeStr } from '../utils/formatTime';
import type { AuctionDto } from '@/api/auction.types';

const STORE_ID = 1; // TODO: auth store에서 가져오기

export default function AuctionEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const auctionId = Number(id);

  const { data: detail, isLoading } = useAuctionDetail(auctionId);
  const auction = detail?.auction;

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg-body)]">
        <p className="text-[var(--color-text-muted)] text-lg">로딩 중...</p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-bg-body)]">
        <p className="text-[var(--color-text-muted)] text-lg">
          경매를 찾을 수 없습니다.
        </p>
        <button
          onClick={() => navigate('/auction')}
          className="mt-4 px-6 py-2 bg-[var(--color-primary)] rounded-xl text-[var(--color-text-primary)] font-bold"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return <AuctionEditForm auction={auction} auctionId={auctionId} />;
}

function AuctionEditForm({
  auction,
  auctionId,
}: {
  auction: AuctionDto;
  auctionId: number;
}) {
  const navigate = useNavigate();
  const updateMutation = useUpdateAuction(STORE_ID);

  const startParsed = parseTimeStr(auction.targetStartTime);
  const endParsed = parseTimeStr(auction.targetEndTime);
  const dl = dayjs(auction.deadline);

  const [selectedDate, setSelectedDate] = useState(dayjs(auction.targetDate));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [startHour, setStartHour] = useState(startParsed.hour);
  const [startMinute, setStartMinute] = useState(startParsed.minute);
  const [endHour, setEndHour] = useState(endParsed.hour);
  const [endMinute, setEndMinute] = useState(endParsed.minute);
  const [timePickerTarget, setTimePickerTarget] = useState<
    'start' | 'end' | null
  >(null);

  const [staffCount, setStaffCount] = useState(String(auction.recruitCount));
  const [staffCountError, setStaffCountError] = useState(false);
  const [minWage, setMinWage] = useState(auction.minWage.toLocaleString());
  const [maxWage, setMaxWage] = useState(auction.maxWage.toLocaleString());

  const [deadlineDate, setDeadlineDate] = useState(dl);
  const [deadlineHour, setDeadlineHour] = useState(dl.hour());
  const [deadlineMinute, setDeadlineMinute] = useState(dl.minute());
  const [deadlineStep, setDeadlineStep] = useState<'date' | 'time' | null>(
    null
  );

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

    if (targetStart.isBefore(now)) {
      toast.error('근무 시작 시간이 현재 시간보다 이전입니다.');
      return;
    }
    if (targetEnd.isBefore(now)) {
      toast.error('근무 종료 시간이 현재 시간보다 이전입니다.');
      return;
    }

    const parsedMinWage = Number(minWage.replace(/,/g, ''));
    const parsedMaxWage = Number(maxWage.replace(/,/g, ''));

    const deadlineStr = `${deadlineDate.format('YYYY-MM-DD')}T${String(deadlineHour).padStart(2, '0')}:${String(deadlineMinute).padStart(2, '0')}:00`;

    updateMutation.mutate(
      {
        auctionId,
        body: {
          targetDate: selectedDate.format('YYYY-MM-DD'),
          targetStartTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`,
          targetEndTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`,
          deadline: deadlineStr,
          minWage: parsedMinWage,
          maxWage: parsedMaxWage,
          recruitCount: Number(staffCount),
        },
      },
      {
        onSuccess: () => {
          toast.success('경매가 수정되었습니다.');
          navigate('/auction');
        },
      }
    );
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-body)]">
      <Header title="경매 수정" onBack={handleCancel} />

      {/* 컨텐츠 */}
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

        {/* 하단 버튼 */}
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
              수정 완료
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
          } else {
            setSelectedDate(date);
            setIsDatePickerOpen(false);
          }
        }}
        onClose={() => {
          if (deadlineStep === 'date') {
            setDeadlineStep(null);
          } else {
            setIsDatePickerOpen(false);
          }
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
          } else if (timePickerTarget === 'start') {
            setStartHour(hour);
            setStartMinute(minute);
            setTimePickerTarget(null);
          } else {
            setEndHour(hour);
            setEndMinute(minute);
            setTimePickerTarget(null);
          }
        }}
        onClose={() => {
          if (deadlineStep === 'time') {
            setDeadlineStep(null);
          } else {
            setTimePickerTarget(null);
          }
        }}
      />
    </div>
  );
}
