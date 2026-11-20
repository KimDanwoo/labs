import { type MusicTrack, parseMusicTracks } from '@views/walk/lib/music/musicSettings';
export const WIDGET_API = 'https://w.soundcloud.com/player/api.js';
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
function unlessFrameDetached(release: () => void): void {
  try {
    release();
  } catch {
    return;
  }
}
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
      const isCurrentTrack = active && request === revision && Number.isInteger(index);
      if (isCurrentTrack) callbacks.track(index);
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
    const hasPosition = typeof currentPosition === 'number' && Number.isFinite(currentPosition);
    if (hasPosition) callbacks.progress(Math.max(0, currentPosition));
  });
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
    unlessFrameDetached(() => widget.pause());
    bound.forEach((event) => unlessFrameDetached(() => widget.unbind(event)));
  };
}
