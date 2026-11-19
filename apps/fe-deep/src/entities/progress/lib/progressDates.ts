import { DATE_PART_LENGTH } from '../model/constants/constants';

const pad = (value: number) => String(value).padStart(DATE_PART_LENGTH, '0');

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayString(): string {
  return localDateKey(new Date());
}

export function addDays(dateString: string, days: number): string {
  const [year = 0, month = 1, day = 1] = dateString.split('-').map(Number);
  return localDateKey(new Date(year, month - 1, day + days));
}

export function reviewedDateKey(lastReviewed: string): string {
  return lastReviewed.includes('T') ? localDateKey(new Date(lastReviewed)) : lastReviewed;
}
