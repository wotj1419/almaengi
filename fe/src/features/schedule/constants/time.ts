// 스케줄 시간 선택 공통 옵션 (30분 단위)
export const SCHEDULE_TIME_OPTIONS = Array.from(
  { length: 24 * 2 },
  (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = (index % 2) * 30;

    return `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
  }
);
