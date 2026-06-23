import type { RunnerAction } from '../constants';

export type RunnerInput = Record<RunnerAction, boolean>;

// 키보드 핸들러와 터치 컨트롤이 함께 쓰는 입력 싱글턴. useFrame 루프가 매 프레임 읽되 리렌더는 없다.
const input: RunnerInput = { forward: false, backward: false, left: false, right: false };

export function setRunnerAction(action: RunnerAction, pressed: boolean): void {
  input[action] = pressed;
}

export function resetRunnerInput(): void {
  (Object.keys(input) as RunnerAction[]).forEach((action) => {
    input[action] = false;
  });
}

export function getRunnerInput(): RunnerInput {
  return input;
}
