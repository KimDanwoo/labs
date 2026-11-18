import type { PointerEvent } from 'react';
import type { RunnerAction } from '../../model/runner-control/constants';
import { setRunnerAction } from '../../model/runner-control/store/runnerInput';

export function handlePress(event: PointerEvent<HTMLButtonElement>, action: RunnerAction) {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  setRunnerAction(action, true);
}
