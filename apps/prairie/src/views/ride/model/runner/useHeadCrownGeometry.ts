import { useEffect, useMemo } from 'react';
import { makeHeadCrownGeometry } from '../../lib/runner/headCrownGeometry';

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
