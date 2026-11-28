'use client';

import { SHAKE } from '@views/gostop/config/playback';
import { shakeFrames } from '@views/gostop/lib/cutIn';
import type { ShownCutIn } from '@views/gostop/model/hooks/useCutIn';
import { useEffect, type RefObject } from 'react';

export const useTableShake = (
  tableRef: RefObject<HTMLElement | null>,
  cutIn: ShownCutIn | null,
  isReducedMotion: boolean,
) => {
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return undefined;
    if (!cutIn) return undefined;
    if (isReducedMotion) return undefined;
    const animation = table.animate(shakeFrames(cutIn.power, cutIn.tone), {
      duration: SHAKE.durationMs,
      delay: SHAKE.delayMs,
      easing: 'ease-out',
    });
    return () => animation.cancel();
  }, [tableRef, cutIn, isReducedMotion]);
};
