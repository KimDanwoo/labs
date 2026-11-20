import { PLAYER_SCREEN, type PlayerScreen, type Track } from '@entities/track';
import { MS_PER_SECOND } from '@views/player/config/time';

function trackPath(track: Track): string {
  return `/t/${track.id}`;
}

const QUEUE_SEGMENT = '/queue';

const TIME_PARAM = 't';

export function shareUrl(track: Track, ms: number, origin: string): string {
  const url = new URL(trackPath(track), origin);
  const seconds = Math.floor(ms / MS_PER_SECOND);
  const isPositiveSeconds = Number.isFinite(seconds) && seconds > 0;
  if (isPositiveSeconds) url.searchParams.set(TIME_PARAM, String(seconds));
  return url.toString();
}

export function readSharedStartMs(search: string): number | null {
  const raw = new URLSearchParams(search).get(TIME_PARAM);
  if (raw === null) return null;
  const seconds = Number(raw);
  const isPositiveTime = Number.isFinite(seconds) && seconds > 0;
  return isPositiveTime ? seconds * MS_PER_SECOND : null;
}

export function playerPath(track: Track, screen: PlayerScreen): string {
  if (screen === PLAYER_SCREEN.archive) return '/';
  return screen === PLAYER_SCREEN.queue ? `${trackPath(track)}${QUEUE_SEGMENT}` : trackPath(track);
}

export function screenFromPath(pathname: string): PlayerScreen {
  if (pathname === '/') return PLAYER_SCREEN.archive;
  return pathname.endsWith(QUEUE_SEGMENT) ? PLAYER_SCREEN.queue : PLAYER_SCREEN.nowPlaying;
}
