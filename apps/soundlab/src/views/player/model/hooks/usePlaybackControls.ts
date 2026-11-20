'use client';

import type { Playback } from '@views/player/model/hooks/usePlayback';
import { PlaybackContext } from '@views/player/model/store/playbackContext';
import { useContext } from 'react';

export function usePlaybackControls(): Playback {
  const controls = useContext(PlaybackContext);
  if (!controls) throw new Error('PlaybackProvider 안에서만 사용할 수 있습니다');
  return controls;
}
