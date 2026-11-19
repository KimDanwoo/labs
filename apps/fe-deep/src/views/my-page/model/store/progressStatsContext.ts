'use client';

import { createContext } from 'react';
import type { ProgressStatsModel } from '../hooks/useProgressStats';

export const ProgressStatsContext = createContext<ProgressStatsModel | null>(null);
