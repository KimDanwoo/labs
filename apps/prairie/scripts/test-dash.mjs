import assert from 'node:assert/strict';
import test from 'node:test';
import { createDashState, DASH_SKILL, updateDash } from '../src/features/runner-control/model/services/dashSkill.ts';

test('제로백은 공중 새 입력에서만 발동하고 0.18초에 최대 출력에 도달한다', () => {
  const state = createDashState();
  updateDash(state, true, 0, 0);
  updateDash(state, true, 5, 0);
  assert.equal(state.active, false);
  updateDash(state, false, 5, 0);
  updateDash(state, true, 5, DASH_SKILL.attack);
  assert.equal(state.active, true);
  assert.equal(state.strength, 1);
  assert.equal(DASH_SKILL.speed * 3.6, 100);
});

test('출력은 부드럽게 감소하고 재사용 대기와 입력 해제를 요구한다', () => {
  const state = createDashState();
  updateDash(state, true, 5, 0);
  updateDash(state, false, 5, DASH_SKILL.duration - DASH_SKILL.release / 2);
  assert.ok(Math.abs(state.strength - 0.5) < 1e-10);
  updateDash(state, false, 5, DASH_SKILL.release / 2);
  assert.equal(state.active, false);
  updateDash(state, true, 5, 0.01);
  assert.equal(state.active, false);
  updateDash(state, true, 5, 10);
  assert.equal(state.active, false);
  updateDash(state, false, 5, 0);
  updateDash(state, true, 5, 0);
  assert.equal(state.active, true);
});

test('착지하면 가속 효과를 종료한다', () => {
  const state = createDashState();
  updateDash(state, true, 5, 0.2);
  updateDash(state, false, 0, 0.01);
  assert.equal(state.active, false);
  assert.equal(state.strength, 0);
});

test('프레임 간격이 달라도 같은 시간의 출력은 같다', () => {
  const sample = (frames) => {
    const state = createDashState();
    updateDash(state, true, 5, 0);
    for (let i = 0; i < frames; i++) updateDash(state, false, 5, 1 / frames);
    return state.strength;
  };
  assert.ok(Math.abs(sample(30) - sample(120)) < 1e-10);
});
