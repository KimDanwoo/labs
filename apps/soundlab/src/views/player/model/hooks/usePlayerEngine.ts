import { useAtomValue } from 'jotai';

import { TRACKS, type PlayerScreen } from '@entities/track';
import { useKeyboard } from '@views/player/model/hooks/useKeyboard';
import { useMediaSession } from '@views/player/model/hooks/useMediaSession';
import { usePlayback } from '@views/player/model/hooks/usePlayback';
import { useTrackUrl } from '@views/player/model/hooks/useTrackUrl';
import { useWaveform } from '@views/player/model/hooks/useWaveform';
import { currentIndexAtom, engineModeAtom, isPlayingAtom, playerScreenAtom } from '@views/player/model/store/playback';

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
