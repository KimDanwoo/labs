import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MAX_STEP_SCALED, splitStep } from '@views/drive/lib/engine/game/physics/physicsTypes';

const SCALE = 2;
const SIXTY_FPS = 1 / 60;

describe('splitStep', () => {
  it('60fps 한 프레임은 한 번에 계산한다 — 지금까지와 같은 결과', () => {
    assert.deepEqual(splitStep(SIXTY_FPS * SCALE, SCALE), { count: 1, scaled: SIXTY_FPS * SCALE, real: SIXTY_FPS });
  });

  it('60fps 프레임 간격이 조금 흔들려도 구간을 나누지 않는다', () => {
    assert.equal(splitStep((1 / 59) * SCALE, SCALE).count, 1);
  });

  it('느린 프레임은 60fps 크기 이하의 같은 구간으로 나눈다', () => {
    for (const fps of [30, 20, 15]) {
      const step = splitStep((1 / fps) * SCALE, SCALE);
      assert.ok(step.scaled <= MAX_STEP_SCALED + Number.EPSILON);
      assert.ok(Math.abs(step.scaled * step.count - (1 / fps) * SCALE) < 1e-12);
      assert.ok(Math.abs(step.real - step.scaled / SCALE) < 1e-12);
    }
  });

  it('느린 화면 연출(scale 0.5)에서는 실제 시간 간격을 그대로 쓴다', () => {
    const step = splitStep(SIXTY_FPS * 0.5, 0.5);
    assert.equal(step.count, 1);
    assert.ok(Math.abs(step.real - SIXTY_FPS) < 1e-12);
  });

  it('멈춘 시간(scale 0)에도 0으로 나누지 않는다', () => {
    assert.deepEqual(splitStep(0, 0), { count: 1, scaled: 0, real: 0 });
  });
});
