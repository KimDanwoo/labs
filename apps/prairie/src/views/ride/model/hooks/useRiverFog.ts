import { useLayoutEffect } from 'react';
import { applyRiverFog } from '../../lib/river/riverFrame';

export function useRiverFog(coarse: boolean): void {
  useLayoutEffect(() => {
    applyRiverFog(coarse);
  }, [coarse]);
}
