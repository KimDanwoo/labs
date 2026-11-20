import { applyRiverFog } from '@views/ride/lib/river/riverFrame';
import { useLayoutEffect } from 'react';

export function useRiverFog(coarse: boolean): void {
  useLayoutEffect(() => {
    applyRiverFog(coarse);
  }, [coarse]);
}
