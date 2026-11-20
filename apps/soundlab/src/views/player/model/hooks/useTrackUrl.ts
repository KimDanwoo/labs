'use client';

import { PLAYER_SCREEN, type PlayerScreen, type Track } from '@entities/track';
import { playerPath, screenFromPath } from '@views/player/lib/playerUrl';
import { currentIndexAtom, playerScreenAtom } from '@views/player/model/store/playback';
import { useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useEffect } from 'react';

export function useTrackUrl(tracks: readonly Track[], initialTrackId?: number, initialScreen?: PlayerScreen) {
  const found = initialTrackId ? tracks.findIndex((track) => track.id === initialTrackId) : -1;
  useHydrateAtoms([
    [currentIndexAtom, found > 0 ? found : 0],
    [playerScreenAtom, initialScreen ?? (initialTrackId ? PLAYER_SCREEN.nowPlaying : PLAYER_SCREEN.archive)],
  ]);

  const index = useAtomValue(currentIndexAtom);
  const screen = useAtomValue(playerScreenAtom);
  const setScreen = useSetAtom(playerScreenAtom);

  useEffect(() => {
    const track = tracks[index];
    if (!track) return;
    document.title = screen === PLAYER_SCREEN.archive ? 'DANWOO — Sound archive' : `${track.title} — DANWOO`;
    const next = playerPath(track, screen);
    if (window.location.pathname === next) return;
    window.history.replaceState(window.history.state, '', next);
  }, [index, screen, tracks]);

  useEffect(() => {
    const sync = () => setScreen(screenFromPath(window.location.pathname));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [setScreen]);
}
