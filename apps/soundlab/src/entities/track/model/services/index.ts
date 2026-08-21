import { PLAYER_SCREEN, type PlayerScreen } from '../constants/playerScreen';
import type { ArtworkSize, Track } from '../types';

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
  /** 여러 곡이 실린 경우에만 의미가 있다. iframe 재탐색 없이 즉시 전환된다. */
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

/** api.js를 한 번만 로드한다. 이미 있으면 즉시 반환. */
export function loadWidgetApi(): Promise<ScGlobal> {
  if (globalThis.SC) return Promise.resolve(globalThis.SC);
  pending ??= new Promise<ScGlobal>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = WIDGET_API_SRC;
    script.async = true;
    script.onload = () => {
      if (globalThis.SC) resolve(globalThis.SC);
      else reject(new Error('api.js를 불러왔지만 SC 전역이 없습니다'));
    };
    script.onerror = () => reject(new Error('SoundCloud Widget API 로드 실패'));
    document.head.append(script);
  });
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

/** 위젯이 준 sound 객체에서 트랙 id를 꺼낸다. 형식이 다르면 매핑에서 제외한다. */
export function soundId(sound: unknown): number | null {
  if (typeof sound !== 'object' || sound === null || !('id' in sound)) return null;
  return typeof sound.id === 'number' ? sound.id : null;
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

/**
 * wave.sndcdn.com은 0–140 정수 1800개를 준다(`ACAO: *`).
 * 0–1로 정규화해 Float32Array로 캐시한다.
 */
export async function fetchWaveform(url: string): Promise<Float32Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`파형 요청 실패: ${response.status}`);
  const { samples, height } = (await response.json()) as { samples: number[]; height: number };
  if (!Array.isArray(samples) || samples.length === 0) throw new Error('파형 샘플이 비어 있습니다');

  const peak = height || Math.max(...samples) || 1;
  const normalized = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) normalized[i] = Math.min(1, (samples[i] ?? 0) / peak);
  return normalized;
}

/**
 * scripts/analyze-audio.mjs가 구운 대역 신호. 곡마다 있을 수도 없을 수도 있다 —
 * 없으면 앱은 사클 파형 폴백으로 돈다(신호가 있는 곡만 확장 시각).
 * 대역은 Uint8을 base64로 담는다(43Hz × 3채널을 평문 배열로 두면 3배가 된다).
 */
export type BandSignals = {
  fps: number;
  audioMs: number;
  low: string;
  mid: string;
  high: string;
  bpm: number | null;
  /** [시각ms, 세기 0–255] — 실제 타격이 있는 격자선만 담긴다. */
  beats: [number, number][];
};

const decodeBand = (base64: string) => {
  const binary = atob(base64);
  const out = new Float32Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i) / 255;
  return out;
};

let manifest: Promise<Set<number>> | null = null;

/** 신호가 있는 곡 목록. 곡마다 404를 두드리지 않으려고 한 번만 받는다. */
export function fetchSignalManifest(): Promise<Set<number>> {
  manifest ??= fetch('/signals/index.json')
    .then((response) => (response.ok ? (response.json() as Promise<number[]>) : []))
    .then((ids) => new Set(ids))
    .catch(() => new Set<number>());
  return manifest;
}

export async function fetchBands(trackId: number) {
  if (!(await fetchSignalManifest()).has(trackId)) return null;
  const response = await fetch(`/signals/${trackId}.json`);
  if (!response.ok) return null;
  const raw = (await response.json()) as BandSignals;
  if (!Number.isFinite(raw.fps) || raw.fps <= 0) return null;
  return {
    fps: raw.fps,
    low: decodeBand(raw.low),
    mid: decodeBand(raw.mid),
    high: decodeBand(raw.high),
    beats: Array.isArray(raw.beats) ? raw.beats : [],
  };
}

/** 공유 링크는 곡 id로 만든다. 제목을 고쳐도, 목록 순서가 바뀌어도 살아있다. */
export function trackPath(track: Track): string {
  return `/t/${track.id}`;
}

export const QUEUE_SEGMENT = '/queue';

/** 주소는 "무슨 곡 + 어떤 화면"을 담는다. 새로고침·공유로 그 화면에 그대로 들어올 수 있다. */
export function playerPath(track: Track, screen: PlayerScreen): string {
  return screen === PLAYER_SCREEN.queue ? `${trackPath(track)}${QUEUE_SEGMENT}` : trackPath(track);
}

export function screenFromPath(pathname: string): PlayerScreen {
  return pathname.endsWith(QUEUE_SEGMENT) ? PLAYER_SCREEN.queue : PLAYER_SCREEN.nowPlaying;
}

const LAST_PLAYED_KEY = 'soundlab:last-played';

/** 나갔다 들어왔을 때 이어 들을 자리. 곡 하나만 기억한다. */
export type LastPlayed = { id: number; ms: number };

/** 저장을 막는 환경(시크릿·저장 거부)이나 낡은 형식이면 이어 듣기만 포기한다. */
export function readLastPlayed(): LastPlayed | null {
  try {
    const raw = localStorage.getItem(LAST_PLAYED_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { id, ms } = parsed as Record<string, unknown>;
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
