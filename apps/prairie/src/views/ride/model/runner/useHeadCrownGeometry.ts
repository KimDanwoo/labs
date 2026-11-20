import { makeHeadCrownGeometry } from '@views/ride/lib/runner/headCrownGeometry';
import { useEffect, useMemo } from 'react';

export function useHeadCrownGeometry() {
  const geometry = useMemo(() => makeHeadCrownGeometry(), []);
  useEffect(
    () => () => {
      geometry.brow.dispose();
      geometry.locks.forEach((lock) => lock.dispose());
    },
    [geometry],
  );
  return geometry;
}
