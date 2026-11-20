import { MS_PER_SECOND } from '@views/walk/config/time';

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
    if (url.protocol !== 'https:') return null;
    if (url.hostname !== 'soundcloud.com') return null;
    if (url.port) return null;
    if (url.username) return null;
    if (url.password) return null;
    const path = url.pathname.replace(/\/$/, '');
    const isUnknownPath = path !== '/danwooking' && !/^\/danwooking\/sets\/[a-zA-Z0-9_-]+$/.test(path);
    if (isUnknownPath) return null;
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}
export function parseMusicPreferences(raw: string | null): MusicPreferences {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value) return DEFAULT_MUSIC;
    if (typeof value !== 'object') return DEFAULT_MUSIC;
    const data = value as Record<string, unknown>;
    const { volume: storedVolume } = data;
    const hasValidVolume = typeof storedVolume === 'number' && Number.isFinite(storedVolume);
    const volume = hasValidVolume ? Math.round(Math.max(0, Math.min(100, storedVolume))) : DEFAULT_MUSIC.volume;
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
const SOUNDCLOUD_TRACK_URL = /^https:\/\/soundcloud\.com\/danwooking\/[^/?#]+$/;

function isTrackId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function trackUrl(value: unknown) {
  const isTrackUrl = typeof value === 'string' && SOUNDCLOUD_TRACK_URL.test(value);
  return isTrackUrl ? value : DANWOO_PROFILE;
}

function trackDuration(value: unknown) {
  const isFiniteNumber = typeof value === 'number' && Number.isFinite(value);
  return isFiniteNumber ? Math.max(0, value) : 0;
}

export function parseMusicTracks(sounds: unknown[]): MusicTrack[] {
  return sounds.flatMap((sound, index) => {
    if (!sound) return [];
    if (typeof sound !== 'object') return [];
    const item = sound as Record<string, unknown>;
    if (!isTrackId(item.id)) return [];
    if (typeof item.title !== 'string') return [];
    return [
      {
        id: item.id,
        index,
        title: item.title,
        url: trackUrl(item.permalink_url),
        duration: trackDuration(item.duration),
      },
    ];
  });
}
export function musicTime(milliseconds: number) {
  const seconds = Number.isFinite(milliseconds) ? Math.max(0, Math.floor(milliseconds / MS_PER_SECOND)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
