import { TRACK_NUMBER_DIGITS } from '@views/player/config/display';
import { MS_PER_SECOND } from '@views/player/config/time';

const SECONDS_PER_MINUTE = 60;
const pad = (value: number) => String(value).padStart(TRACK_NUMBER_DIGITS, '0');

export function formatTrackNumber(position: number) {
  return pad(position + 1);
}

export function formatSeconds(seconds: number) {
  const isPositiveSeconds = Number.isFinite(seconds) && seconds > 0;
  const safe = isPositiveSeconds ? seconds : 0;
  return `${Math.floor(safe / SECONDS_PER_MINUTE)}:${pad(Math.floor(safe % SECONDS_PER_MINUTE))}`;
}

export function formatDurationMs(ms: number) {
  return formatSeconds(ms / MS_PER_SECOND);
}
