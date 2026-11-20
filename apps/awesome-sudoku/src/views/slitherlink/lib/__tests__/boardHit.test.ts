import { BOARD_PADDING, CELL_UNIT, SNAP_RADIUS, TAP_MAX_DISTANCE } from '@views/slitherlink/config/boardView';
import { boardSpan, nearestEdge, nearestVertex, toLatticePoint, vertexWithin } from '@views/slitherlink/lib/boardHit';
import { getTopology } from '@views/slitherlink/lib/topology';
import { describe, expect, it } from 'vitest';

const SIZE = 2;
const topology = getTopology(SIZE);

describe('화면 좌표 → 격자 좌표', () => {
  it('판 크기와 여백을 반영해 점 좌표로 바꾼다', () => {
    const rect = { left: 10, top: 20, width: boardSpan(SIZE) * 2 };
    const firstVertex = { x: 10 + BOARD_PADDING * 2, y: 20 + BOARD_PADDING * 2 };
    expect(toLatticePoint(rect, SIZE, firstVertex.x, firstVertex.y)).toEqual({ x: 0, y: 0 });
    expect(toLatticePoint(rect, SIZE, firstVertex.x + CELL_UNIT * 2, firstVertex.y).x).toBeCloseTo(1);
  });
});

describe('가장 가까운 변', () => {
  it('가로 변 가까이를 누르면 그 가로 변을 고른다', () => {
    expect(nearestEdge(topology, { x: 0.5, y: 0.1 }, TAP_MAX_DISTANCE)).toBe(0);
    expect(nearestEdge(topology, { x: 1.4, y: 2.2 }, TAP_MAX_DISTANCE)).toBe(5);
  });

  it('세로 변 가까이를 누르면 그 세로 변을 고른다', () => {
    expect(nearestEdge(topology, { x: 0.1, y: 0.5 }, TAP_MAX_DISTANCE)).toBe(6);
    expect(nearestEdge(topology, { x: 1.9, y: 1.6 }, TAP_MAX_DISTANCE)).toBe(11);
  });

  it('칸 한가운데처럼 어느 변에서도 멀면 고르지 않는다', () => {
    expect(nearestEdge(topology, { x: 0.5, y: 0.5 }, TAP_MAX_DISTANCE)).toBeNull();
  });

  it('판 바깥 여백을 눌러도 가장자리 변을 고른다', () => {
    expect(nearestEdge(topology, { x: 1.5, y: -0.3 }, TAP_MAX_DISTANCE)).toBe(1);
  });
});

describe('가장 가까운 점', () => {
  it('반지름 안에 있을 때만 점을 돌려준다', () => {
    expect(vertexWithin(SIZE, { x: 1.1, y: 0.9 }, SNAP_RADIUS)).toBe(4);
    expect(vertexWithin(SIZE, { x: 1.5, y: 0.5 }, SNAP_RADIUS)).toBeNull();
  });

  it('판 밖 좌표는 가장자리 점으로 붙인다', () => {
    expect(nearestVertex(SIZE, { x: -3, y: 9 })).toBe(6);
  });
});
