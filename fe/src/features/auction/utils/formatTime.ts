export function formatTime(hour: number, minute: number) {
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${period} ${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function parseTimeStr(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}
