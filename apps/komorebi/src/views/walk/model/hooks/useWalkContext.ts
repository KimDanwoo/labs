'use client';

import type { WalkModel } from '@views/walk/model/hooks/useWalk';
import { WalkContext } from '@views/walk/model/store/walkContext';
import { useContext } from 'react';

export function useWalkContext(): WalkModel {
  const walk = useContext(WalkContext);
  if (!walk) throw new Error('Walk.Root 안에서만 사용할 수 있습니다');
  return walk;
}
