import { useAtomValue } from 'jotai';

import { TRACKS, type PlayerScreen } from '@entities/track';
import { currentIndexAtom, engineModeAtom, isPlayingAtom, playerScreenAtom } from '../store/playback';
import { useKeyboard } from './useKeyboard';
import { useMediaSession } from './useMediaSession';
import { usePlayback } from './usePlayback';
import { useTrackUrl } from './useTrackUrl';
import { useWaveform } from './useWaveform';

export function usePlayerEngine(initialTrackId?: number, initialScreen?: PlayerScreen) {
  useTrackUrl(TRACKS, initialTrackId, initialScreen);

  const index = useAtomValue(currentIndexAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const engineMode = useAtomValue(engineModeAtom);
  const screen = useAtomValue(playerScreenAtom);

  const playback = usePlayback(TRACKS, initialTrackId);
  useWaveform(TRACKS[index], TRACKS[(index + 1) % TRACKS.length], isPlaying);
  useKeyboard(playback);
  useMediaSession(TRACKS[index], isPlaying, playback);

  return { playback, engineMode, screen };
}
