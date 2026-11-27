const KOREAN_DATE = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

export function formatKoreanDate(date: Date): string {
  return KOREAN_DATE.format(date);
}
