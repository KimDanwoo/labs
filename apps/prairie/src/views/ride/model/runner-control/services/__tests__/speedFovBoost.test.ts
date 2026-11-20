import assert from 'node:assert/strict';
import test from 'node:test';
import { SPRINT_FOV_BOOST } from '../../../../lib/runner-control/runnerRig';
import { DASH_SKILL } from '../dashSkill';
import { speedFovBoost } from '../runnerCamera';

test('질주·대시는 시야를 넓히고, 둘이 겹치면 더 큰 쪽을 쓴다', () => {
  assert.equal(speedFovBoost(false, 0, false), 0);
  assert.equal(speedFovBoost(true, 0, false), SPRINT_FOV_BOOST);
  assert.equal(speedFovBoost(true, 1, false), DASH_SKILL.fovBoost);
  assert.equal(speedFovBoost(false, 0.5, false), DASH_SKILL.fovBoost / 2);
});

test('움직임 줄이기에서는 질주·대시에도 화면이 확대·축소되지 않는다', () => {
  assert.equal(speedFovBoost(true, 1, true), 0);
  assert.equal(speedFovBoost(true, 0, true), 0);
});
