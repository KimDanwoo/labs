'use client';

import type { GostopGame } from '@views/gostop/model/hooks/useGostopGame';
import { createContext } from 'react';

export const GostopContext = createContext<GostopGame | null>(null);
