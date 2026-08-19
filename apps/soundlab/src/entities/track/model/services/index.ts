import type { ArtworkSize, Track } from '../types';

const WIDGET_API_SRC = 'https://w.soundcloud.com/player/api.js';

type WidgetPayload = { currentPosition?: number; relativePosition?: number };

export type ScWidget = {
  bind(event: string, callback: (payload: WidgetPayload) => void): void;
  unbind(event: string): void;
  load(url: string, options?: Record<string, unknown>): void;
  play(): void;
  pause(): void;
  seekTo(milliseconds: number): void;
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
 * 24곡을 한 번에 올린다. 성공하면 곡 전환이 widget.skip()으로 끝나 iframe 재탐색이 사라진다.
 * 이 형식이 받아들여지는지는 런타임에 getSounds로 확인하고, 아니면 곡별 load로 폴백한다.
 */
export function multiTrackUrl(tracks: readonly Track[]): string {
  return `https://api.soundcloud.com/tracks/${tracks.map((track) => track.id).join(',')}`;
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
