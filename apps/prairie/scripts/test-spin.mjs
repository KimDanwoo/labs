import assert from 'node:assert/strict';
import test from 'node:test';
import { createSpinState, SPIN_SKILL, updateSpin } from '../src/features/runner-control/model/services/spinSkill.ts';

test('회전은 충분한 비행 고도에서 새 입력으로만 시작한다', () => {
  const state = createSpinState();
  updateSpin(state, true, 0, 0.01);
  assert.equal(state.active, false);
  updateSpin(state, true, 5, 0.01);
  assert.equal(state.active, false);
  updateSpin(state, false, 5, 0.01);
  updateSpin(state, true, 5, 0.01);
  assert.equal(state.active, true);
});

test('한 바퀴 후 자세를 복원하고 누르고 있어도 재발동하지 않는다', () => {
  const state = createSpinState();
  updateSpin(state, true, 5, SPIN_SKILL.duration / 2);
  assert.ok(Math.abs(state.angle - Math.PI) < 1e-10);
  updateSpin(state, true, 5, SPIN_SKILL.duration / 2);
  assert.equal(state.active, false);
  assert.equal(state.angle, 0);
  updateSpin(state, true, 5, 10);
  assert.equal(state.active, false);
  updateSpin(state, false, 5, 0.01);
  updateSpin(state, true, 5, 0.01);
  assert.equal(state.active, true);
});

test('재사용 대기 중 연타는 무시한다', () => {
  const state = createSpinState();
  updateSpin(state, true, 5, 0);
  updateSpin(state, false, 5, SPIN_SKILL.duration);
  updateSpin(state, true, 5, 0.01);
  assert.equal(state.active, false);
});
