import dayjs from 'dayjs';
import DatePickerModal from '@/components/common/DateSheet';
import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof DatePickerModal>, 'minDate'>;

export default function TodoDatePicker(props: Props) {
  return <DatePickerModal {...props} minDate={dayjs()} />;
}
