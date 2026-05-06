import { STORAGE_KEYS } from '@shared/constants';
import { SM2_CONSTANTS } from '@entities/progress/model';

/** 오늘 날짜를 YYYY-MM-DD로 반환한다. */
export function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/** 오늘의 데일리 챌린지 완료 여부를 확인한다. */
export function isDailyDone(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.DAILY_PREFIX + todayKey()) === 'done';
}

/** 오늘의 데일리 챌린지를 완료로 표시한다. 오래된 기록은 정리한다. */
export function markDailyDone() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DAILY_PREFIX + todayKey(), 'done');

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SM2_CONSTANTS.DAILY_CLEANUP_DAYS);
  const cutoffKey = cutoff.toISOString().split('T')[0];

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEYS.DAILY_PREFIX)) {
      const dateStr = key.slice(STORAGE_KEYS.DAILY_PREFIX.length);
      if (dateStr < cutoffKey) {
        localStorage.removeItem(key);
      }
    }
  }
}
