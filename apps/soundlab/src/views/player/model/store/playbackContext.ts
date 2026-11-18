'use client';

import { createContext } from 'react';
import type { Playback } from '../hooks/usePlayback';

export const PlaybackContext = createContext<Playback | null>(null);
