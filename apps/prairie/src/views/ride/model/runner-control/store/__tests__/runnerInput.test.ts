import { getRunnerInput, resetRunnerInput, setRunnerAction } from '@views/ride/model/runner-control/store/runnerInput';
import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

beforeEach(resetRunnerInput);

test('같은 동작에 묶인 두 키를 누르다 하나만 떼면 계속 눌린 상태다', () => {
  setRunnerAction('forward', true, 'KeyW');
  setRunnerAction('forward', true, 'ArrowUp');
  setRunnerAction('forward', false, 'KeyW');
  assert.equal(getRunnerInput().forward, true);

  setRunnerAction('forward', false, 'ArrowUp');
  assert.equal(getRunnerInput().forward, false);
});

test('조이스틱이 방향을 놓아도 키보드로 누르고 있는 방향은 유지된다', () => {
  setRunnerAction('forward', true, 'KeyW');
  setRunnerAction('forward', false);
  assert.equal(getRunnerInput().forward, true);
});

test('초기화하면 누르고 있던 출처도 함께 지워진다', () => {
  setRunnerAction('sprint', true, 'ShiftLeft');
  resetRunnerInput();
  setRunnerAction('sprint', true);
  setRunnerAction('sprint', false);
  assert.equal(getRunnerInput().sprint, false);
});
