const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MINUTES_DIGITS = 2;
const SECONDS_DIGITS = 2;
const MILLISECONDS_DIGITS = 3;

const pad = (value: number, digits: number): string => String(Math.floor(value)).padStart(digits, '0');

export function timeToRaceString(seconds: number): string {
  const minutes = seconds / SECONDS_PER_MINUTE;
  const remainder = seconds % SECONDS_PER_MINUTE;
  const milliseconds = (seconds * MILLISECONDS_PER_SECOND) % MILLISECONDS_PER_SECOND;
  return `${pad(minutes, MINUTES_DIGITS)}:${pad(remainder, SECONDS_DIGITS)}:${pad(milliseconds, MILLISECONDS_DIGITS)}`;
}
