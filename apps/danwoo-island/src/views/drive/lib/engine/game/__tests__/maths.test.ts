import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  circleIntersectsPolygon,
  remap,
  remapClamp,
  segmentCircleIntersection,
  smallestAngle,
} from '../utilities/maths';

const SQUARE = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 },
];

describe('maths', () => {
  it('범위를 선형으로 옮기고 remapClamp는 출력 범위로 자른다', () => {
    assert.equal(remap(5, [0, 10], [0, 100]), 50);
    assert.equal(remapClamp(20, [0, 10], [0, 100]), 100);
    assert.equal(remapClamp(-5, [0, 10], [1, 0]), 1);
  });

  it('가장 짧은 회전 방향의 각도 차를 준다', () => {
    assert.ok(Math.abs(smallestAngle(0, (3 * Math.PI) / 2) + Math.PI / 2) < 1e-9);
  });

  it('선분과 원의 교점을 찾는다', () => {
    const hits = segmentCircleIntersection({ x: -2, y: 0 }, { x: 2, y: 0 }, { center: { x: 0, y: 0 }, radius: 1 });
    assert.deepEqual(hits, [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ]);
    assert.deepEqual(
      segmentCircleIntersection({ x: -2, y: 5 }, { x: 2, y: 5 }, { center: { x: 0, y: 0 }, radius: 1 }),
      [],
    );
  });

  it('원이 다각형과 겹치는지 꼭짓점·변·내부 순으로 판정한다', () => {
    assert.equal(circleIntersectsPolygon({ center: { x: 1, y: 1 }, radius: 0.1 }, SQUARE), true);
    assert.equal(circleIntersectsPolygon({ center: { x: 3, y: 1 }, radius: 1.1 }, SQUARE), true);
    assert.equal(circleIntersectsPolygon({ center: { x: 5, y: 5 }, radius: 1 }, SQUARE), false);
  });
});
