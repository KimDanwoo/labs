import type { RunnerAction } from '../constants';

type RunnerInput = Record<RunnerAction, boolean>;

const TOUCH_SOURCE = 'touch';

// 키보드 핸들러와 터치 컨트롤이 함께 쓰는 입력 싱글턴. useFrame 루프가 매 프레임 읽되 리렌더는 없다.
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
