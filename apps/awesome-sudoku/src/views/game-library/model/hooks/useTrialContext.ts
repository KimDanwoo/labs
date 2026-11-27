'use client';

import { useContext } from 'react';

import { TrialContext, type TrialModel } from '@views/game-library/model/store/trialContext';

export function useTrialContext(): TrialModel {
  const trial = useContext(TrialContext);
  if (!trial) throw new Error('Trial.Root 안에서만 사용할 수 있어요');
  return trial;
}
