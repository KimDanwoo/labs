import { TRACK_NUMBER_DIGITS } from '../config/display';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const pad = (value: number) => String(value).padStart(TRACK_NUMBER_DIGITS, '0');

export function formatTrackNumber(position: number) {
  return pad(position + 1);
}

/** 곡 목록용 길이 — 밀리초를 반올림한 초로 보여준다. */
export function formatDurationMs(ms: number) {
  const total = Math.round(ms / MS_PER_SECOND);
  return `${Math.floor(total / SECONDS_PER_MINUTE)}:${pad(total % SECONDS_PER_MINUTE)}`;
}

/** 재생 바용 시각 — 초를 버림하고, 유한한 양수가 아니면 0으로 본다. */
export function formatSeconds(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return `${Math.floor(safe / SECONDS_PER_MINUTE)}:${pad(Math.floor(safe % SECONDS_PER_MINUTE))}`;
}
