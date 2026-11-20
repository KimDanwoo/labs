import { useEffect, useState } from 'react';

import { bootWorld } from '@views/drive/lib/bootWorld';

export function useWorldBoot() {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    bootWorld(() => isMounted).catch(() => setHasFailed(true));
    return () => {
      isMounted = false;
    };
  }, []);

  return { hasFailed };
}
