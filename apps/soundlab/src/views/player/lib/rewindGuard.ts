import { REWIND_TOLERANCE_MS, REWIND_WATCH_MS } from '@views/player/config/playback';

export interface PendingRewind {
  ms: number;
  since: number;
  attempts: number;
}

export const isRewindWatched = (pending: PendingRewind, now: number) => now - pending.since <= REWIND_WATCH_MS;

export const hasLostRewind = (pending: PendingRewind, position: number, now: number) =>
  Math.abs(position - (pending.ms + now - pending.since)) > REWIND_TOLERANCE_MS;
