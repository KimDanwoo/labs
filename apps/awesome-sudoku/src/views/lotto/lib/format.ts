import { EMPTY_VALUE, PERCENT, WEEKLY_TICKETS, WEEKS_PER_YEAR } from '@views/lotto/config/display';

const KOREAN_LOCALE = 'ko-KR';
const EOK = 100_000_000;
const MAN = 10_000;
const ENDS_WITH_DIGIT = /\d$/;

export const formatNumber = (value: number): string => Math.round(value).toLocaleString(KOREAN_LOCALE);

export function formatKoreanUnits(value: number): string {
  const whole = Math.max(0, Math.round(value));
  const parts: readonly (readonly [number, string])[] = [
    [Math.floor(whole / EOK), '억'],
    [Math.floor((whole % EOK) / MAN), '만'],
    [whole % MAN, ''],
  ];
  const text = parts
    .filter(([amount]) => amount > 0)
    .map(([amount, unit]) => `${formatNumber(amount)}${unit}`)
    .join(' ');
  return text === '' ? '0' : text;
}

const withCounter = (units: string, counter: string): string =>
  ENDS_WITH_DIGIT.test(units) ? `${units}${counter}` : `${units} ${counter}`;

export const formatWon = (value: number): string => withCounter(formatKoreanUnits(value), '원');

export const formatTickets = (value: number): string => withCounter(formatKoreanUnits(value), '장');

export const formatOdds = (probability: number): string =>
  probability > 0 ? `1/${formatNumber(1 / probability)}` : EMPTY_VALUE;

export const formatPercent = (ratio: number, digits = 1): string => `${(ratio * PERCENT).toFixed(digits)}%`;

export const formatSignedPercent = (ratio: number): string =>
  ratio > 0 ? `+${formatPercent(ratio)}` : formatPercent(ratio);

export const weeksToBuy = (tickets: number): number => Math.ceil(tickets / WEEKLY_TICKETS);

export function formatBuyingDuration(tickets: number): string {
  const weeks = weeksToBuy(tickets);
  if (weeks < WEEKS_PER_YEAR) return `${formatNumber(weeks)}주`;
  return `${formatNumber(weeks / WEEKS_PER_YEAR)}년`;
}
