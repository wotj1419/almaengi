import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import DatePickerModal from '@/components/common/DateSheet';
import TimePickerModal from '@/components/common/TimeSheet';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { getApiErrorMessage } from '@/api/error';
import type { AuctionDto } from '@/api/auction.types';
import AuctionSettingsCard from '../components/AuctionSettingsCard';
import WorkInfoCard from '../components/WorkInfoCard';
import { useAuctionDetail, useUpdateAuction } from '../hooks/useAuctionQueries';
import { formatTime, parseTimeStr } from '../utils/formatTime';

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
  const updateMutation = useUpdateAuction();

  const startParsed = parseTimeStr(auction.targetStartTime);
  const endParsed = parseTimeStr(auction.targetEndTime);
  const deadlineParsed = dayjs(auction.deadline);

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

  const [deadlineDate, setDeadlineDate] = useState(deadlineParsed);
  const [deadlineHour, setDeadlineHour] = useState(deadlineParsed.hour());
  const [deadlineMinute, setDeadlineMinute] = useState(deadlineParsed.minute());
  const [deadlineStep, setDeadlineStep] = useState<'date' | 'time' | null>(
    null
  );

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

    updateMutation.mutate(
      {
        auctionId,
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
          toast.success('경매가 수정되었습니다.');
          navigate('/auction');
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, '경매 수정에 실패했습니다.'));
        },
      }
    );
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-body)]">
      {/* auctionStyle: 다른 경매 페이지와 헤더 스타일 통일 */}
      <Header title="경매 수정" onBack={() => navigate(-1)} auctionStyle />

      <main className="px-[15px] pt-[20px] pb-[calc(96px+env(safe-area-inset-bottom,0px))] flex flex-col gap-[15px]">
        <WorkInfoCard
          date={selectedDate.format('YYYY. MM. DD')}
          staffCount={staffCount}
          startTime={formatTime(startHour, startMinute)}
          endTime={formatTime(endHour, endMinute)}
          onDateClick={() => setIsDatePickerOpen(true)}
          onStartTimeClick={() => setTimePickerTarget('start')}
          onEndTimeClick={() => setTimePickerTarget('end')}
          onStaffCountChange={(value) => {
            setStaffCount(value);
            setStaffCountError(false);
          }}
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
            onClick={() => navigate(-1)}
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
