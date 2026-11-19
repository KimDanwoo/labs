'use client';

import { useContext } from 'react';
import { WalkContext } from '../store/walkContext';
import type { WalkModel } from './useWalk';

export function useWalkContext(): WalkModel {
  const walk = useContext(WalkContext);
  if (!walk) throw new Error('Walk.Root 안에서만 사용할 수 있습니다');
  return walk;
}
