'use client';

import type { Playback } from '@views/player/model/hooks/usePlayback';
import { createContext } from 'react';

export const PlaybackContext = createContext<Playback | null>(null);
