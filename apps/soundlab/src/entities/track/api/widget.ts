import { parseBandSignals, parseWaveform } from '../lib/signals';
import { type PlayerScreen, PLAYER_SCREEN } from '../model/constants/playerScreen';
import type { ArtworkSize, Track } from '../model/types/track';

const WIDGET_API_SRC = 'https://w.soundcloud.com/player/api.js';

/** loadedProgress는 loadProgress와 playProgress 양쪽에 실려 온다. 한쪽이 안 와도 버퍼 표시가 살아남는다. */
type WidgetPayload = { currentPosition?: number; relativePosition?: number; loadedProgress?: number };

export type ScWidget = {
  bind(event: string, callback: (payload: WidgetPayload) => void): void;
  unbind(event: string): void;
  load(url: string, options?: Record<string, unknown>): void;
  play(): void;
  pause(): void;
  seekTo(milliseconds: number): void;
  /** 0–100. 페이드에 쓴다 — 위젯 오디오는 cross-origin이라 이게 유일한 음량 손잡이다. */
  setVolume(volume: number): void;
  getDuration(callback: (milliseconds: number) => void): void;
  skip(soundIndex: number): void;
  getSounds(callback: (sounds: unknown[]) => void): void;
  getCurrentSoundIndex(callback: (index: number) => void): void;
};

type ScGlobal = {
  Widget: ((element: HTMLIFrameElement | string) => ScWidget) & {
    Events: Record<string, string>;
  };
};

declare global {
  var SC: ScGlobal | undefined;
}

let pending: Promise<ScGlobal> | null = null;

export function loadWidgetApi(): Promise<ScGlobal> {
  if (globalThis.SC) return Promise.resolve(globalThis.SC);
  if (!pending) {
    pending = new Promise<ScGlobal>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = WIDGET_API_SRC;
      script.async = true;
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error('재생 API 연결 시간 초과'));
      }, 10_000);
      script.onload = () => {
        clearTimeout(timer);
        if (globalThis.SC) resolve(globalThis.SC);
        else reject(new Error('api.js를 불러왔지만 SC 전역이 없습니다'));
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error('SoundCloud Widget API 로드 실패'));
      };
      document.head.append(script);
    });
    // 실패까지 캐시하면 새로고침 전엔 재시도가 불가능하다. 다음 호출이 다시 시도하게 비운다.
    pending.catch(() => {
      pending = null;
    });
  }
  return pending;
}

export function trackUrl(track: Track): string {
  return `https://api.soundcloud.com/tracks/${track.id}`;
}

/**
 * 곡 전체를 한 플레이어에 올린다. 성공하면 전환이 widget.skip()으로 끝나 새 재생 시작이 사라진다
 * — 백그라운드에서 다음 곡으로 넘어가려면 이게 필요하다.
 *
 * 콤마로 이어붙인 `tracks/id1,id2,...`는 위젯이 404로 거절한다. 프로필 URL은 받는다.
 * permalinkUrl에서 뽑아 쓰므로 계정이 바뀌어도 따라간다.
 */
export function setUrl(tracks: readonly Track[]): string | null {
  const first = tracks[0];
  if (!first) return null;
  const [scheme, , host, user] = first.permalinkUrl.split('/');
  if (!scheme || !host || !user) return null;
  return `${scheme}//${host}/${user}`;
}

export function soundId(sound: unknown): number | null {
  if (typeof sound !== 'object' || sound === null || !('id' in sound)) return null;
  return typeof sound.id === 'number' && Number.isSafeInteger(sound.id) && sound.id > 0 ? sound.id : null;
}

const ENGINE_FRAME_STYLE = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0';

/** 소리만 내는 숨은 위젯 iframe을 문서에 붙인다. display:none은 일부 엔진에서 미디어 재생을 막아 1×1 투명으로 둔다. */
export function mountEngineFrame(src: string): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.style.cssText = ENGINE_FRAME_STYLE;
  frame.allow = 'autoplay';
  frame.setAttribute('aria-hidden', 'true');
  frame.title = 'SoundCloud 재생 엔진';
  frame.src = src;
  document.body.append(frame);
  return frame;
}

export function widgetSrc(url: string): string {
  const params = new URLSearchParams({
    url,
    auto_play: 'false',
    show_artwork: 'false',
    show_comments: 'false',
    show_user: 'false',
    show_teaser: 'false',
    hide_related: 'true',
    sharing: 'false',
    download: 'false',
    buying: 'false',
    visual: 'false',
  });
  return `https://w.soundcloud.com/player/?${params}`;
}

/** 확장자를 반드시 보존한다. 고정하면 절반 이상이 404가 난다. */
export function artworkUrl(track: Track, size: ArtworkSize): string {
  return `${track.artworkBase}-${size}${track.artworkExt}`;
}

export async function fetchWaveform(url: string): Promise<Float32Array> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`파형 요청 실패: ${response.status}`);
  return parseWaveform(await response.json());
}

/**
 * scripts/analyze-audio.mjs가 구운 대역 신호. 곡마다 있을 수도 없을 수도 있다 —
 * 없으면 앱은 사클 파형 폴백으로 돈다(신호가 있는 곡만 확장 시각).
 * 대역은 Uint8을 base64로 담는다(43Hz × 3채널을 평문 배열로 두면 3배가 된다).
 */
const decodeBand = (base64: string) => {
  const binary = atob(base64);
  const out = new Float32Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i) / 255;
  return out;
};

let manifest: Promise<Set<number>> | null = null;

function fetchSignalManifest(): Promise<Set<number>> {
  manifest ??= fetch('/signals/index.json', { signal: AbortSignal.timeout(10_000) })
    .then(async (response): Promise<unknown> => (response.ok ? response.json() : []))
    .then(
      (ids) =>
        new Set<number>(
          Array.isArray(ids)
            ? ids.filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0)
            : [],
        ),
    )
    .catch(() => new Set<number>());
  return manifest;
}

export async function fetchBands(trackId: number, durationMs: number) {
  if (!(await fetchSignalManifest()).has(trackId)) return null;
  const response = await fetch(`/signals/${trackId}.json`, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) return null;
  const raw = parseBandSignals(await response.json());
  if (!raw || Math.abs(raw.audioMs - durationMs) > 250) return null;
  return {
    fps: raw.fps,
    low: decodeBand(raw.low),
    mid: decodeBand(raw.mid),
    high: decodeBand(raw.high),
    beats: raw.beats,
  };
}

/** 공유 링크는 곡 id로 만든다. 제목을 고쳐도, 목록 순서가 바뀌어도 살아있다. */
function trackPath(track: Track): string {
  return `/t/${track.id}`;
}

const QUEUE_SEGMENT = '/queue';

/** 공유 링크가 시작 지점을 싣는 이름. 유튜브와 같게 둔다 — 손으로 고쳐 쓸 수 있어야 한다. */
const TIME_PARAM = 't';

export function shareUrl(track: Track, ms: number, origin: string): string {
  const url = new URL(trackPath(track), origin);
  const seconds = Math.floor(ms / 1000);
  if (Number.isFinite(seconds) && seconds > 0) url.searchParams.set(TIME_PARAM, String(seconds));
  return url.toString();
}

export function readSharedStartMs(search: string): number | null {
  const raw = new URLSearchParams(search).get(TIME_PARAM);
  if (raw === null) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
}

export function playerPath(track: Track, screen: PlayerScreen): string {
  if (screen === PLAYER_SCREEN.archive) return '/';
  return screen === PLAYER_SCREEN.queue ? `${trackPath(track)}${QUEUE_SEGMENT}` : trackPath(track);
}

export function screenFromPath(pathname: string): PlayerScreen {
  if (pathname === '/') return PLAYER_SCREEN.archive;
  return pathname.endsWith(QUEUE_SEGMENT) ? PLAYER_SCREEN.queue : PLAYER_SCREEN.nowPlaying;
}

const LAST_PLAYED_KEY = 'soundlab:last-played';

type LastPlayed = { id: number; ms: number };

export function readLastPlayed(): LastPlayed | null {
  try {
    const raw = localStorage.getItem(LAST_PLAYED_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (!('id' in parsed) || !('ms' in parsed)) return null;
    const { id, ms } = parsed;
    if (typeof id !== 'number' || !Number.isInteger(id)) return null;
    if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return null;
    return { id, ms };
  } catch {
    return null;
  }
}

export function writeLastPlayed(last: LastPlayed): void {
  try {
    localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(last));
  } catch {
    return;
  }
}

export function readStartTarget(sharedTrackId: number | undefined): LastPlayed | null {
  if (sharedTrackId === undefined) return readLastPlayed();
  const ms = readSharedStartMs(window.location.search);
  return ms === null ? null : { id: sharedTrackId, ms };
}
