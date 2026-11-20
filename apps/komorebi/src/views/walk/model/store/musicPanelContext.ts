'use client';

import type { MusicPanel } from '@views/walk/model/hooks/music/useMusicPanel';
import { createContext } from 'react';

export const MusicPanelContext = createContext<MusicPanel | null>(null);
