import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  lastVisiblePoint,
  nearbyPoints,
  needsRetest,
  type PointState,
} from '@views/drive/lib/engine/game/pointProximity';

class LinePosition {
  constructor(readonly x: number) {}

  distanceTo(other: LinePosition): number {
    return Math.abs(this.x - other.x);
  }
}

interface TestPoint {
  name: string;
  position: LinePosition;
  state: PointState;
}

const point = (name: string, x: number, state: PointState = 'concealed'): TestPoint => ({
  name,
  position: new LinePosition(x),
  state,
});

const names = (points: readonly TestPoint[]): string[] => points.map(({ name }) => name);

describe('needsRetest', () => {
  it('0.2 넘게 움직였거나 다시 검사를 요청했을 때만', () => {
    assert.equal(needsRetest(0.2, false), false);
    assert.equal(needsRetest(0.21, false), true);
    assert.equal(needsRetest(0, true), true);
    assert.equal(needsRetest(Number.NaN, false), true);
  });
});

describe('nearbyPoints', () => {
  it('2.5 미만 거리의 점만 등록 순서대로 남긴다', () => {
    const items = [point('edge', 2.5), point('near', 1), point('inside', 2.49), point('far', -3)];
    assert.deepEqual(names(nearbyPoints(items, new LinePosition(0))), ['near', 'inside']);
  });
});

describe('lastVisiblePoint', () => {
  it('가까운 점 중 마지막에 등록된 숨겨지지 않은 점을 고른다', () => {
    const nearby = [point('first', 0.1), point('second', 2), point('hidden', 0, 'hidden')];
    assert.equal(lastVisiblePoint(nearby)?.name, 'second');
  });

  it('모두 숨겨져 있으면 null', () => {
    assert.equal(lastVisiblePoint([point('hidden', 0, 'hidden')]), null);
  });
});
