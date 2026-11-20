import type { RunnerAction } from '@views/ride/model/runner-control/constants';

type RunnerInput = Record<RunnerAction, boolean>;

const TOUCH_SOURCE = 'touch';

const input: RunnerInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
  spin: false,
  dash: false,
  descend: false,
};

const actions = Object.keys(input) as RunnerAction[];
const pressedSources = Object.fromEntries(actions.map((action) => [action, new Set<string>()])) as Record<
  RunnerAction,
  Set<string>
>;

export function setRunnerAction(action: RunnerAction, pressed: boolean, source: string = TOUCH_SOURCE): void {
  if (pressed) pressedSources[action].add(source);
  else pressedSources[action].delete(source);
  input[action] = pressedSources[action].size > 0;
}

export function resetRunnerInput(): void {
  actions.forEach((action) => {
    pressedSources[action].clear();
    input[action] = false;
  });
}

export function getRunnerInput(): RunnerInput {
  return input;
}
