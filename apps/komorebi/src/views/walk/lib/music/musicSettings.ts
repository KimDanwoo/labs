import { MS_PER_SECOND } from '../../config/time';

export const DANWOO_PROFILE = 'https://soundcloud.com/danwooking';
export const MUSIC_STORAGE_KEY = 'komorebi-music-v1';
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
  const seconds = Number.isFinite(milliseconds) ? Math.max(0, Math.floor(milliseconds / MS_PER_SECOND)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
