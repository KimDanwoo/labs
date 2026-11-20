import { artworkUrl, TRACKS } from '@entities/track';

import { ARTWORK_TEXTURE_SIZE } from '@views/player/config/stage';

const images = new Map<number, Promise<HTMLImageElement>>();

const NEIGHBOR_OFFSETS = [1, -1] as const;

export function loadArtwork(index: number): Promise<HTMLImageElement> {
  const cached = images.get(index);
  if (cached) return cached;
  const track = TRACKS[index];
  if (!track) return Promise.reject(new Error('트랙이 없습니다'));

  const loading = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('아트워크를 불러오지 못했습니다'));
    image.src = artworkUrl(track, ARTWORK_TEXTURE_SIZE);
  });
  images.set(index, loading);
  loading.catch(() => images.delete(index));
  return loading;
}

export function warmNeighbors(index: number) {
  for (const offset of NEIGHBOR_OFFSETS) {
    loadArtwork((index + offset + TRACKS.length) % TRACKS.length).catch(() => undefined);
  }
}
