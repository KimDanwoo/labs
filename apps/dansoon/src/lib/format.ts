const TIME_ZONE = 'Asia/Seoul';
// ponytail: 한국어 본문 기준 대략치(분당 600자). 코드 블록도 같은 속도로 센다 — 체감과 크게 어긋나면 코드만 따로 가중치를 둔다.
const READING_CHARS_PER_MINUTE = 600;

const longDate = new Intl.DateTimeFormat('ko-KR', { timeZone: TIME_ZONE, dateStyle: 'long' });
const shortDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const yearOnly = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric' });

/** 2026년 7월 29일 */
export const formatLongDate = (date: Date) => longDate.format(date);

/** 2026. 07. 29. → 2026.07.29 */
export const formatShortDate = (date: Date) => shortDate.format(date).replace(/\.\s?/g, '.').replace(/\.$/, '');

export const yearOf = (date: Date) => Number(yearOnly.format(date));

export function readingMinutes(markdown: string | undefined) {
  const characters = (markdown ?? '').replace(/\s/g, '').length;
  return Math.max(1, Math.round(characters / READING_CHARS_PER_MINUTE));
}
