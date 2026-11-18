import { useAtomValue } from 'jotai';

import {
  currentIndexAtom,
  engineModeAtom,
  isPlayingAtom,
  playerScreenAtom,
  TRACKS,
  useKeyboard,
  useMediaSession,
  usePlayback,
  useTrackUrl,
  useWaveform,
  type PlayerScreen,
} from '@entities/track';

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
