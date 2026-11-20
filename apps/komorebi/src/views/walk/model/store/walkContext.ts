'use client';

import type { WalkModel } from '@views/walk/model/hooks/useWalk';
import { createContext } from 'react';

export const WalkContext = createContext<WalkModel | null>(null);
