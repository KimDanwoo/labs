'use client';

import type { GomokuGame } from '@views/gomoku/model/hooks/useGomokuGame';
import { createContext } from 'react';

export const GomokuContext = createContext<GomokuGame | null>(null);
