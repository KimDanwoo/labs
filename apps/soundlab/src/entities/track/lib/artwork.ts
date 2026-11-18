import type { ArtworkSize, Track } from '../model/types/track';

/** 확장자를 반드시 보존한다. 고정하면 절반 이상이 404가 난다. */
export function artworkUrl(track: Track, size: ArtworkSize): string {
  return `${track.artworkBase}-${size}${track.artworkExt}`;
}
