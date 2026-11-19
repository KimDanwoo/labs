'use client';

import { useContext } from 'react';
import { ProgressStatsContext } from '../store/progressStatsContext';
import type { ProgressStatsModel } from './useProgressStats';

export function useProgressStatsContext(): ProgressStatsModel {
  const value = useContext(ProgressStatsContext);
  if (!value) throw new Error('Progress.Root 안에서만 사용할 수 있습니다');
  return value;
}
