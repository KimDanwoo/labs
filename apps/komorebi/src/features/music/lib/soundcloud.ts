export const DANWOO_PROFILE = 'https://soundcloud.com/danwooking';
export const MUSIC_STORAGE_KEY = 'komorebi-music-v1';
export const WIDGET_API = 'https://w.soundcloud.com/player/api.js';
export const MUSIC_STATUS = { loading: 'loading', ready: 'ready', error: 'error' } as const;
export type MusicStatus = (typeof MUSIC_STATUS)[keyof typeof MUSIC_STATUS];
export type MusicTrack = { id: number; index: number; title: string; url: string; duration: number };
export type MusicPreferences = { volume: number; source: string };
export const DEFAULT_MUSIC: MusicPreferences = { volume: 35, source: DANWOO_PROFILE };

export function musicSource(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' || url.hostname !== 'soundcloud.com' || url.port || url.username || url.password)
      return null;
    const path = url.pathname.replace(/\/$/, '');
    if (path !== '/danwooking' && !/^\/danwooking\/sets\/[a-zA-Z0-9_-]+$/.test(path)) return null;
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}
export function parseMusicPreferences(raw: string | null): MusicPreferences {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return DEFAULT_MUSIC;
    const data = value as Record<string, unknown>;
    const volume =
      typeof data.volume === 'number' && Number.isFinite(data.volume)
        ? Math.round(Math.max(0, Math.min(100, data.volume)))
        : DEFAULT_MUSIC.volume;
    return {
      volume,
      source: typeof data.source === 'string' ? (musicSource(data.source) ?? DANWOO_PROFILE) : DANWOO_PROFILE,
    };
  } catch {
    return DEFAULT_MUSIC;
  }
}
export function musicWidgetSrc(source: string) {
  const params = new URLSearchParams({
    url: musicSource(source) ?? DANWOO_PROFILE,
    auto_play: 'false',
    visual: 'false',
    show_artwork: 'true',
    show_comments: 'false',
    show_user: 'true',
    hide_related: 'true',
    color: '#65785c',
  });
  return `https://w.soundcloud.com/player/?${params}`;
}
export function parseMusicTracks(sounds: unknown[]): MusicTrack[] {
  return sounds.flatMap((sound, index) => {
    if (!sound || typeof sound !== 'object') return [];
    const item = sound as Record<string, unknown>;
    if (typeof item.id !== 'number' || !Number.isSafeInteger(item.id) || item.id <= 0 || typeof item.title !== 'string')
      return [];
    const url =
      typeof item.permalink_url === 'string' &&
      /^https:\/\/soundcloud\.com\/danwooking\/[^/?#]+$/.test(item.permalink_url)
        ? item.permalink_url
        : DANWOO_PROFILE;
    const duration =
      typeof item.duration === 'number' && Number.isFinite(item.duration) ? Math.max(0, item.duration) : 0;
    return [{ id: item.id, index, title: item.title, url, duration }];
  });
}
export function musicTime(milliseconds: number) {
  const seconds = Number.isFinite(milliseconds) ? Math.max(0, Math.floor(milliseconds / 1000)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export type WidgetPayload = { currentPosition?: number };
export type MusicWidget = {
  bind: (event: string, listener: (payload: WidgetPayload) => void) => void;
  unbind: (event: string) => void;
  play: () => void;
  pause: () => void;
  prev: () => void;
  next: () => void;
  skip: (index: number) => void;
  seekTo: (milliseconds: number) => void;
  setVolume: (volume: number) => void;
  getSounds: (callback: (sounds: unknown[]) => void) => void;
  getCurrentSoundIndex: (callback: (index: number) => void) => void;
  isPaused: (callback: (paused: boolean) => void) => void;
};
export type SoundCloudApi = {
  Widget: ((iframe: HTMLIFrameElement) => MusicWidget) & { Events: Record<string, string> };
};
let pending: Promise<SoundCloudApi> | null = null;
function currentApi() {
  return (window as Window & { SC?: SoundCloudApi }).SC;
}
export function loadMusicApi(): Promise<SoundCloudApi> {
  const api = currentApi();
  if (api) return Promise.resolve(api);
  if (pending) return pending;
  pending = new Promise<SoundCloudApi>((resolve, reject) => {
    const script = document.createElement('script');
    let timer = 0;
    const finish = () => {
      window.clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
    };
    const fail = () => {
      finish();
      script.remove();
      reject(new Error('사운드클라우드 연결을 확인해 주세요.'));
    };
    timer = window.setTimeout(fail, 15000);
    script.src = WIDGET_API;
    script.async = true;
    script.onload = () => {
      const loaded = currentApi();
      if (!loaded) {
        fail();
        return;
      }
      finish();
      resolve(loaded);
    };
    script.onerror = fail;
    document.head.append(script);
  });
  pending.catch(() => {
    pending = null;
  });
  return pending;
}

type MusicCallbacks = {
  ready: (tracks: MusicTrack[]) => void;
  playing: (playing: boolean) => void;
  track: (index: number) => void;
  progress: (position: number) => void;
  error: () => void;
};
/** Own exactly one widget. Late postMessage callbacks cannot update a disposed player. */
export function bindMusicWidget(
  widget: MusicWidget,
  events: Record<string, string>,
  callbacks: MusicCallbacks,
  volume: number,
) {
  let active = true;
  let revision = 0;
  const bound: string[] = [];
  const bind = (name: string, handler: (payload: WidgetPayload) => void) => {
    const event = events[name];
    if (!event) return;
    widget.bind(event, (payload) => {
      if (active) handler(payload);
    });
    bound.push(event);
  };
  const current = () => {
    const request = ++revision;
    widget.getCurrentSoundIndex((index) => {
      if (active && request === revision && Number.isInteger(index)) callbacks.track(index);
    });
  };
  bind('READY', () => {
    widget.setVolume(volume);
    widget.getSounds((sounds) => {
      if (!active) return;
      const tracks = parseMusicTracks(sounds);
      if (!tracks.length) {
        callbacks.error();
        return;
      }
      callbacks.ready(tracks);
      current();
    });
  });
  bind('PLAY', () => {
    callbacks.playing(true);
    current();
  });
  bind('PAUSE', () => callbacks.playing(false));
  bind('PLAY_PROGRESS', ({ currentPosition }) => {
    if (typeof currentPosition === 'number' && Number.isFinite(currentPosition))
      callbacks.progress(Math.max(0, currentPosition));
  });
  // Multi-track SoundCloud widgets advance themselves; calling next here would skip a song.
  bind('FINISH', () => {
    callbacks.playing(false);
  });
  bind('ERROR', () => {
    callbacks.playing(false);
    callbacks.error();
  });
  return () => {
    active = false;
    revision++;
    widget.pause();
    bound.forEach((event) => widget.unbind(event));
  };
}
