import type { Playback } from '@entities/track/model/hooks';
import { createContext } from 'react';

export const PlaybackContext = createContext<Playback | null>(null);
