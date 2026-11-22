import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BOAT_SEABED, isInPond, shouldBoat } from '@views/drive/lib/engine/game/physics/boatWaters';

const AFLOAT = 0.4;
const ON_BRIDGE = 1.2;
const OPEN_SEA = { isFlying: false, x: -94, z: -30, elevation: AFLOAT } as const;
const POND_CENTER = { isFlying: false, x: -17, z: 20, elevation: AFLOAT } as const;
const BETWEEN = (BOAT_SEABED.enter + BOAT_SEABED.leave) / 2;
const DEEP = -1.5;
const DRY = 0;

describe('shouldBoat', () => {
  it('깊은 바다에 들어가면 배가 된다', () => {
    assert.equal(shouldBoat({ isBoating: false, ...OPEN_SEA, seabed: DEEP }), true);
  });

  it('지형 밖(바닥이 없는 바다)은 언제나 배다', () => {
    assert.equal(shouldBoat({ isBoating: false, ...OPEN_SEA, seabed: null }), true);
  });

  it('얕은 물과 땅에서는 바퀴로 달린다', () => {
    assert.equal(shouldBoat({ isBoating: true, ...OPEN_SEA, seabed: DRY }), false);
  });

  it('경계 깊이에서는 지금 상태를 유지해 깜박이지 않는다', () => {
    assert.equal(shouldBoat({ isBoating: false, ...OPEN_SEA, seabed: BETWEEN }), false);
    assert.equal(shouldBoat({ isBoating: true, ...OPEN_SEA, seabed: BETWEEN }), true);
  });

  it('다리 위처럼 물 위로 높이 떠 있으면 배가 되지 않는다', () => {
    assert.equal(shouldBoat({ isBoating: false, ...OPEN_SEA, elevation: ON_BRIDGE, seabed: DEEP }), false);
    assert.equal(shouldBoat({ isBoating: true, ...OPEN_SEA, elevation: ON_BRIDGE, seabed: DEEP }), false);
  });

  it('연못은 깊어도 배가 되지 않는다', () => {
    assert.equal(isInPond(POND_CENTER.x, POND_CENTER.z), true);
    assert.equal(shouldBoat({ isBoating: true, ...POND_CENTER, seabed: DEEP }), false);
  });

  it('날고 있으면 물 위로 내려와도 배가 되지 않는다', () => {
    assert.equal(shouldBoat({ isBoating: true, ...OPEN_SEA, isFlying: true, seabed: DEEP }), false);
  });
});
