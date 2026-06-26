// 로컬 기준 날짜 키(YYYY-M-D). 같은 날 비교·집계에 사용.
export const toDateKey = (date: Date): string => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export const isSameDay = (a: Date, b: Date): boolean => toDateKey(a) === toDateKey(b);

// "HH:MM" (24시간).
export const formatTime = (date: Date): string =>
  `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
