'use client';

import { createContext } from 'react';
import type { MusicPanel } from '../hooks/music/useMusicPanel';

export const MusicPanelContext = createContext<MusicPanel | null>(null);
