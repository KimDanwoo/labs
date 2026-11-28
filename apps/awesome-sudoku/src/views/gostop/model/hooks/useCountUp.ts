'use client';

import { COUNT_UP_MS } from '@views/gostop/config/result';
import { countUpValue, isCountDone } from '@views/gostop/lib/countUp';
import { useEffect, useState } from 'react';

export const useCountUp = (target: number, isInstant: boolean): number => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (isInstant) return undefined;
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      setValue(countUpValue(target, elapsed, COUNT_UP_MS));
      if (!isCountDone(elapsed, COUNT_UP_MS)) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, isInstant]);

  return isInstant ? target : value;
};
