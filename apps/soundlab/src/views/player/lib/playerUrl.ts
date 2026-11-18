import { PLAYER_SCREEN, type PlayerScreen, type Track } from '@entities/track';
import { MS_PER_SECOND } from '../config/time';

/** 공유 링크는 곡 id로 만든다. 제목을 고쳐도, 목록 순서가 바뀌어도 살아있다. */
function trackPath(track: Track): string {
  return `/t/${track.id}`;
}

const QUEUE_SEGMENT = '/queue';

/** 공유 링크가 시작 지점을 싣는 이름. 유튜브와 같게 둔다 — 손으로 고쳐 쓸 수 있어야 한다. */
const TIME_PARAM = 't';

export function shareUrl(track: Track, ms: number, origin: string): string {
  const url = new URL(trackPath(track), origin);
  const seconds = Math.floor(ms / MS_PER_SECOND);
  if (Number.isFinite(seconds) && seconds > 0) url.searchParams.set(TIME_PARAM, String(seconds));
  return url.toString();
}

export function readSharedStartMs(search: string): number | null {
  const raw = new URLSearchParams(search).get(TIME_PARAM);
  if (raw === null) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * MS_PER_SECOND : null;
}

export function playerPath(track: Track, screen: PlayerScreen): string {
  if (screen === PLAYER_SCREEN.archive) return '/';
  return screen === PLAYER_SCREEN.queue ? `${trackPath(track)}${QUEUE_SEGMENT}` : trackPath(track);
}

export function screenFromPath(pathname: string): PlayerScreen {
  if (pathname === '/') return PLAYER_SCREEN.archive;
  return pathname.endsWith(QUEUE_SEGMENT) ? PLAYER_SCREEN.queue : PLAYER_SCREEN.nowPlaying;
}
