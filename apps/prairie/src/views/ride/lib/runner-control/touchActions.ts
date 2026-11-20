import type { RunnerAction } from '@views/ride/model/runner-control/constants';
import { setRunnerAction } from '@views/ride/model/runner-control/store/runnerInput';
import type { PointerEvent } from 'react';

export function handlePress(event: PointerEvent<HTMLButtonElement>, action: RunnerAction) {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  setRunnerAction(action, true);
}
