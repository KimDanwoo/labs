'use client';

import { createContext } from 'react';
import type { WalkModel } from '../hooks/useWalk';

export const WalkContext = createContext<WalkModel | null>(null);
