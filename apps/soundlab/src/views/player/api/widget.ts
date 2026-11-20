import type { Track } from '@entities/track';
import { REQUEST_TIMEOUT_MS } from '@views/player/config/network';

const WIDGET_API_SRC = 'https://w.soundcloud.com/player/api.js';

type WidgetPayload = { currentPosition?: number; relativePosition?: number; loadedProgress?: number };

export type ScWidget = {
  bind(event: string, callback: (payload: WidgetPayload) => void): void;
  unbind(event: string): void;
  load(url: string, options?: Record<string, unknown>): void;
  play(): void;
  pause(): void;
  seekTo(milliseconds: number): void;
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
      }, REQUEST_TIMEOUT_MS);
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
    pending.catch(() => {
      pending = null;
    });
  }
  return pending;
}

export function trackUrl(track: Track): string {
  return `https://api.soundcloud.com/tracks/${track.id}`;
}

export function setUrl(tracks: readonly Track[]): string | null {
  const first = tracks[0];
  if (!first) return null;
  const [scheme, , host, user] = first.permalinkUrl.split('/');
  if (!scheme) return null;
  if (!host) return null;
  if (!user) return null;
  return `${scheme}//${host}/${user}`;
}

function soundId(sound: unknown): number | null {
  if (typeof sound !== 'object') return null;
  if (sound === null) return null;
  if (!('id' in sound)) return null;
  const { id } = sound;
  const isValidSoundId = typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
  return isValidSoundId ? id : null;
}

export const readSoundIds = (sounds: unknown[]) => (Array.isArray(sounds) ? sounds.map(soundId) : []);

const ENGINE_FRAME_SIZE = { width: 320, height: 166 };
const ENGINE_FRAME_STYLE = `position:fixed;left:0;top:0;width:${ENGINE_FRAME_SIZE.width}px;height:${ENGINE_FRAME_SIZE.height}px;opacity:0;pointer-events:none;border:0`;

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
