import type { ArtworkSize, Track } from '@entities/track/model/types/track';

export function artworkUrl(track: Track, size: ArtworkSize): string {
  return `${track.artworkBase}-${size}${track.artworkExt}`;
}
