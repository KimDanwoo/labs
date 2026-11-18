import { DATE_PART_LENGTH } from '../config/heatmap';

const pad = (value: number) => String(value).padStart(DATE_PART_LENGTH, '0');

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
