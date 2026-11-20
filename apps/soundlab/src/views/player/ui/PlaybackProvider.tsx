'use client';

import type { Playback } from '@views/player/model/hooks/usePlayback';
import { PlaybackContext } from '@views/player/model/store/playbackContext';
import type { ReactNode } from 'react';

export function PlaybackProvider({ value, children }: { value: Playback; children: ReactNode }) {
  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}
