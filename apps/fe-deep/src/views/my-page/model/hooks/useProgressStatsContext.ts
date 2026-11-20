'use client';

import type { ProgressStatsModel } from '@views/my-page/model/hooks/useProgressStats';
import { ProgressStatsContext } from '@views/my-page/model/store/progressStatsContext';
import { useContext } from 'react';

export function useProgressStatsContext(): ProgressStatsModel {
  const value = useContext(ProgressStatsContext);
  if (!value) throw new Error('Progress.Root 안에서만 사용할 수 있습니다');
  return value;
}
