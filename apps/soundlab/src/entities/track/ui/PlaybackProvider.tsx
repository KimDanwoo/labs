'use client';

import type { ReactNode } from 'react';
import type { Playback } from '../model/hooks/usePlayback';
import { PlaybackContext } from '../model/store/playbackContext';

export function PlaybackProvider({ value, children }: { value: Playback; children: ReactNode }) {
  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}
