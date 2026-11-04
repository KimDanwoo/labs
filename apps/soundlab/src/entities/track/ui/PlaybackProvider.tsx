'use client';

import type { Playback } from '@entities/track/model/hooks';
import { PlaybackContext } from '@entities/track/model/store';
import type { ReactNode } from 'react';

export function PlaybackProvider({ value, children }: { value: Playback; children: ReactNode }) {
  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}
