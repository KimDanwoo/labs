import { artworkUrl, TRACKS } from '@entities/track';

import { ARTWORK_TEXTURE_SIZE } from '@views/player/config/stage';

/**
 * 아트워크는 다른 오리진이므로 crossOrigin 없이는 텍스처 업로드가 보안 오류로 막힌다.
 * 이미지가 아니라 약속을 캐시한다 — 선반입과 실제 전환이 겹쳐도 두 번 받지 않는다.
 */
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
  // 실패한 약속을 캐시에 남기면 그 곡은 영구히 못 받는다. 다음 시도에 다시 받게 비운다.
  loading.catch(() => images.delete(index));
  return loading;
}

export function warmNeighbors(index: number) {
  for (const offset of NEIGHBOR_OFFSETS) {
    loadArtwork((index + offset + TRACKS.length) % TRACKS.length).catch(() => undefined);
  }
}
