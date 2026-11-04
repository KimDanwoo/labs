'use client';

import { PlaybackContext } from '@entities/track/model/store';
import { useContext } from 'react';
import type { Playback } from './usePlayback';

export function usePlaybackControls(): Playback {
  const controls = useContext(PlaybackContext);
  if (!controls) throw new Error('PlaybackProvider 안에서만 사용할 수 있습니다');
  return controls;
}
