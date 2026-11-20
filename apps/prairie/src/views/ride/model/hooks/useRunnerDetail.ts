import { useLayoutEffect } from 'react';
import { applyRunnerDetail, type PreparedRunner } from '../../lib/runner/prepareRunnerModel';
import { useLowDetail } from '../ride-state/sceneQuality';

export function useRunnerDetail(prepared: PreparedRunner): void {
  const isLowDetail = useLowDetail();
  useLayoutEffect(() => applyRunnerDetail(prepared, isLowDetail), [prepared, isLowDetail]);
}
