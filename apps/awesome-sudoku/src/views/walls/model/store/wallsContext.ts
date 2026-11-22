'use client';

import type { WallsGame } from '@views/walls/model/hooks/useWallsGame';
import { createContext } from 'react';

export const WallsContext = createContext<WallsGame | null>(null);
