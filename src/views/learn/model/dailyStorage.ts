const DAILY_KEY_PREFIX = 'fe-daily-';

/** 오늘 날짜를 YYYY-MM-DD로 반환한다. */
export function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/** 오늘의 데일리 챌린지 완료 여부를 확인한다. */
export function isDailyDone(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DAILY_KEY_PREFIX + todayKey()) === 'done';
}

/** 오늘의 데일리 챌린지를 완료로 표시한다. 7일 이상 된 기록은 정리한다. */
export function markDailyDone() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DAILY_KEY_PREFIX + todayKey(), 'done');

  // 오래된 daily 키 정리
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffKey = cutoff.toISOString().split('T')[0];

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(DAILY_KEY_PREFIX)) {
      const dateStr = key.slice(DAILY_KEY_PREFIX.length);
      if (dateStr < cutoffKey) {
        localStorage.removeItem(key);
      }
    }
  }
}
