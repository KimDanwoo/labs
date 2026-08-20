'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useEffect } from 'react';
import { PLAYER_SCREEN, type PlayerScreen } from '../constants/playerScreen';
import { playerPath, screenFromPath } from '../services';
import { currentIndexAtom, playerScreenAtom } from '../store';
import type { Track } from '../types';

/**
 * 주소창이 "지금 듣는 곡 + 지금 보는 화면"을 가리키게 한다 — 주소를 복사하면 그게 곧 공유 링크다.
 *
 * Next 라우터(router.push/replace)를 쓰지 않는다. 라우트가 바뀌면 트리가 리마운트될 수 있고,
 * 재생 엔진 iframe은 usePlayback의 클린업에서 지워지므로 그 순간 소리가 끊긴다.
 * 주소만 바꾸면 되므로 history API로 충분하다 — 화면 전환도 같은 이유로 pushState를 쓴다.
 */
export function useTrackUrl(tracks: readonly Track[], initialTrackId?: number, initialScreen?: PlayerScreen) {
  const found = initialTrackId ? tracks.findIndex((track) => track.id === initialTrackId) : -1;
  // 첫 렌더에서 원자를 채워야 0번 곡·현재 재생 화면을 먼저 보여줬다가 덮어쓰는 깜빡임이 없다.
  useHydrateAtoms([
    [currentIndexAtom, found > 0 ? found : 0],
    [playerScreenAtom, initialScreen ?? PLAYER_SCREEN.nowPlaying],
  ]);

  const index = useAtomValue(currentIndexAtom);
  const screen = useAtomValue(playerScreenAtom);
  const setScreen = useSetAtom(playerScreenAtom);

  // 상태 → 주소
  useEffect(() => {
    const track = tracks[index];
    if (!track) return;
    const next = playerPath(track, screen);
    if (window.location.pathname === next) return;
    // state를 null로 덮으면 Next가 그 히스토리 항목을 복원할 근거를 잃는다. 있는 그대로 물려준다.
    window.history.replaceState(window.history.state, '', next);
  }, [index, screen, tracks]);

  // 주소 → 상태. 뒤로/앞으로가 화면 전환을 되돌린다.
  // 곡은 되돌리지 않는다 — 엔진에 load/skip을 걸지 않고 인덱스만 바꾸면 목록 하이라이트가 실제 소리와 어긋난다.
  useEffect(() => {
    const sync = () => setScreen(screenFromPath(window.location.pathname));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [setScreen]);
}
