const WIDGET_API_SRC = 'https://w.soundcloud.com/player/api.js';
const WIDGET_PLAYER = 'https://w.soundcloud.com/player/';
const API_TIMEOUT_MS = 10_000;
const FRAME_SIZE = { width: 320, height: 166 };
const FRAME_STYLE = `position:fixed;left:0;top:0;width:${FRAME_SIZE.width}px;height:${FRAME_SIZE.height}px;opacity:0;pointer-events:none;border:0`;

export type WidgetEvent = 'READY' | 'PLAY' | 'PAUSE' | 'FINISH' | 'PLAY_PROGRESS' | 'ERROR';

export interface WidgetPayload {
  soundId?: number;
  relativePosition?: number;
}

export interface SoundCloudWidget {
  bind(event: string, callback: (payload?: WidgetPayload) => void): void;
  load(url: string, options?: { auto_play?: boolean; callback?: () => void }): void;
  play(): void;
  pause(): void;
  setVolume(volume: number): void;
}

export interface WidgetFrame {
  remove(): void;
}

export interface SoundCloudGlobal {
  Widget: ((element: WidgetFrame) => SoundCloudWidget) & { Events: Partial<Record<WidgetEvent, string>> };
}

declare global {
  var SC: SoundCloudGlobal | undefined;
}

let pending: Promise<SoundCloudGlobal> | null = null;

export function loadWidgetApi(): Promise<SoundCloudGlobal> {
  if (globalThis.SC) return Promise.resolve(globalThis.SC);
  pending ??= new Promise<SoundCloudGlobal>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = WIDGET_API_SRC;
    script.async = true;
    const timer = setTimeout(() => {
      script.remove();
      reject(new Error('SoundCloud Widget API timed out'));
    }, API_TIMEOUT_MS);
    const fail = (message: string): void => {
      clearTimeout(timer);
      script.remove();
      reject(new Error(message));
    };
    script.onload = () => {
      clearTimeout(timer);
      if (globalThis.SC) resolve(globalThis.SC);
      else fail('SoundCloud Widget API loaded without SC global');
    };
    script.onerror = () => fail('SoundCloud Widget API failed to load');
    document.head.append(script);
  }).catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

export function trackApiUrl(trackId: number): string {
  return `https://api.soundcloud.com/tracks/${trackId}`;
}

export function mountWidgetFrame(trackId: number): HTMLIFrameElement {
  const params = new URLSearchParams({
    url: trackApiUrl(trackId),
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
  const frame = document.createElement('iframe');
  frame.style.cssText = FRAME_STYLE;
  frame.allow = 'autoplay';
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.title = 'SoundCloud player';
  frame.src = `${WIDGET_PLAYER}?${params}`;
  document.body.append(frame);
  return frame;
}
