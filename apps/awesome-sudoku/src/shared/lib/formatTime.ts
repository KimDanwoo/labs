import { MINUTE } from '@shared/config/time';

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / MINUTE);
  const secs = seconds % MINUTE;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
