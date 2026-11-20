'use client';

import { ElapsedContext } from '@views/slitherlink/model/store/elapsedContext';
import { useContext } from 'react';

export function useElapsedContext(): number {
  const seconds = useContext(ElapsedContext);
  if (seconds === null) throw new Error('SlitherlinkGame.Root 안에서만 사용할 수 있어요');
  return seconds;
}
