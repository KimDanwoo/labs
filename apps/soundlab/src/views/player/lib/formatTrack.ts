import { TRACK_NUMBER_DIGITS } from '../config/display';
import { MS_PER_SECOND } from '../config/time';

const SECONDS_PER_MINUTE = 60;
const pad = (value: number) => String(value).padStart(TRACK_NUMBER_DIGITS, '0');

export function formatTrackNumber(position: number) {
  return pad(position + 1);
}

/** 초를 버림하고, 유한한 양수가 아니면 0으로 본다. 흐른 시간이 곡 끝에서 전체 길이와 같아지려면 둘 다 버림이어야 한다. */
export function formatSeconds(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return `${Math.floor(safe / SECONDS_PER_MINUTE)}:${pad(Math.floor(safe % SECONDS_PER_MINUTE))}`;
}

export function formatDurationMs(ms: number) {
  return formatSeconds(ms / MS_PER_SECOND);
}
