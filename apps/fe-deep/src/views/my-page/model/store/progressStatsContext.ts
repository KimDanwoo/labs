'use client';

import type { ProgressStatsModel } from '@views/my-page/model/hooks/useProgressStats';
import { createContext } from 'react';

export const ProgressStatsContext = createContext<ProgressStatsModel | null>(null);
