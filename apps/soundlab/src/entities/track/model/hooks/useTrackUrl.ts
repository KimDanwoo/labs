'use client';

import { useAtomValue } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useEffect } from 'react';
import { trackPath } from '../services';
import { currentIndexAtom } from '../store';
import type { Track } from '../types';

/**
 * 주소창이 항상 지금 듣는 곡을 가리키게 한다 — 주소를 복사하면 그게 곧 그 곡의 공유 링크다.
 *
 * Next 라우터(router.replace)를 쓰지 않는다. 곡을 넘길 때마다 RSC 요청이 나가고
 * 라우트가 바뀌면서 PlayerView가 리마운트될 수 있는데, 그러면 재생 중인 위젯이 날아간다.
 * 주소만 바꾸면 되므로 history.replaceState로 충분하다.
 */
export function useTrackUrl(tracks: readonly Track[], initialTrackId?: number) {
  const found = initialTrackId ? tracks.findIndex((track) => track.id === initialTrackId) : -1;
  // 첫 렌더에서 원자를 채워야 0번 곡을 먼저 보여줬다가 덮어쓰는 깜빡임이 없다.
  // 공유 링크가 아니면 기본값 0을 그대로 넣는다(useHydrateAtoms는 빈 배열을 받지 않는다).
  useHydrateAtoms([[currentIndexAtom, found > 0 ? found : 0]]);

  const index = useAtomValue(currentIndexAtom);

  useEffect(() => {
    const track = tracks[index];
    if (!track) return;
    const next = trackPath(track);
    if (window.location.pathname === next) return;
    window.history.replaceState(null, '', next);
  }, [index, tracks]);
}
