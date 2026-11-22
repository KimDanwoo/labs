import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { GOAL, isBallInGoal, isBallOffPitch, PITCH } from '@views/drive/lib/engine/game/world/areas/beachGoalRules';

const RADIUS = 1;
const restingY = PITCH.groundY + RADIUS;
const insideGoalX = PITCH.goalLineX - RADIUS - 0.1;

describe('isBallInGoal', () => {
  it('공 전체가 골라인을 넘어 골대 안에 있으면 골이다', () => {
    assert.equal(isBallInGoal({ x: insideGoalX, y: restingY, z: PITCH.centerZ }, RADIUS), true);
  });

  it('공이 골라인에 걸쳐 있으면 아직 골이 아니다', () => {
    assert.equal(isBallInGoal({ x: PITCH.goalLineX, y: restingY, z: PITCH.centerZ }, RADIUS), false);
  });

  it('골대 옆이나 크로스바 위로 지나가면 골이 아니다', () => {
    const besidePost = PITCH.centerZ + GOAL.halfWidth + RADIUS;
    assert.equal(isBallInGoal({ x: insideGoalX, y: restingY, z: besidePost }, RADIUS), false);
    const overBar = PITCH.groundY + GOAL.height + RADIUS;
    assert.equal(isBallInGoal({ x: insideGoalX, y: overBar, z: PITCH.centerZ }, RADIUS), false);
  });
});

describe('isBallOffPitch', () => {
  it('경기장 안의 공은 그대로 둔다', () => {
    assert.equal(isBallOffPitch({ x: PITCH.halfwayX, y: restingY, z: PITCH.centerZ }), false);
  });

  it('옆으로 멀리 나가거나 물에 빠지면 되돌린다', () => {
    assert.equal(isBallOffPitch({ x: PITCH.halfwayX, y: restingY, z: PITCH.centerZ + 10 }), true);
    assert.equal(isBallOffPitch({ x: PITCH.halfwayX, y: PITCH.groundY - 5, z: PITCH.centerZ }), true);
  });
});
