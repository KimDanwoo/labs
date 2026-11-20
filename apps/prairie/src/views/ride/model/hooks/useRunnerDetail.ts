import { applyRunnerDetail, type PreparedRunner } from '@views/ride/lib/runner/prepareRunnerModel';
import { useLowDetail } from '@views/ride/model/ride-state/sceneQuality';
import { useLayoutEffect } from 'react';

export function useRunnerDetail(prepared: PreparedRunner): void {
  const isLowDetail = useLowDetail();
  useLayoutEffect(() => applyRunnerDetail(prepared, isLowDetail), [prepared, isLowDetail]);
}
