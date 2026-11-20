import { BOARD_PADDING, CELL_UNIT } from '@views/slitherlink/config/boardView';
import { edgeBetween, vertexIndex } from '@views/slitherlink/lib/lattice';
import type { GridTopology } from '@views/slitherlink/model/types/slitherlink';

export interface LatticePoint {
  x: number;
  y: number;
}

interface BoardRect {
  left: number;
  top: number;
  width: number;
}

interface EdgeCandidate {
  edge: number | null;
  distance: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const boardSpan = (size: number): number => size * CELL_UNIT + BOARD_PADDING * 2;

export const toLatticePoint = (rect: BoardRect, size: number, clientX: number, clientY: number): LatticePoint => {
  const scale = boardSpan(size) / rect.width;
  return {
    x: ((clientX - rect.left) * scale - BOARD_PADDING) / CELL_UNIT,
    y: ((clientY - rect.top) * scale - BOARD_PADDING) / CELL_UNIT,
  };
};

export const nearestVertex = (size: number, point: LatticePoint): number =>
  vertexIndex(size, { row: clamp(Math.round(point.y), 0, size), col: clamp(Math.round(point.x), 0, size) });

export const vertexWithin = (size: number, point: LatticePoint, radius: number): number | null => {
  const row = clamp(Math.round(point.y), 0, size);
  const col = clamp(Math.round(point.x), 0, size);
  const distance = Math.hypot(point.x - col, point.y - row);
  return distance <= radius ? vertexIndex(size, { row, col }) : null;
};

const segmentDistance = (along: number, across: number, alongStart: number): number => {
  const overshoot = Math.max(0, alongStart - along, along - (alongStart + 1));
  return Math.hypot(overshoot, across);
};

const horizontalCandidate = (topology: GridTopology, point: LatticePoint): EdgeCandidate => {
  const { size } = topology;
  const row = clamp(Math.round(point.y), 0, size);
  const col = clamp(Math.floor(point.x), 0, size - 1);
  return {
    edge: edgeBetween(topology, vertexIndex(size, { row, col }), vertexIndex(size, { row, col: col + 1 })),
    distance: segmentDistance(point.x, point.y - row, col),
  };
};

const verticalCandidate = (topology: GridTopology, point: LatticePoint): EdgeCandidate => {
  const { size } = topology;
  const row = clamp(Math.floor(point.y), 0, size - 1);
  const col = clamp(Math.round(point.x), 0, size);
  return {
    edge: edgeBetween(topology, vertexIndex(size, { row, col }), vertexIndex(size, { row: row + 1, col })),
    distance: segmentDistance(point.y, point.x - col, row),
  };
};

export const nearestEdge = (topology: GridTopology, point: LatticePoint, maxDistance: number): number | null => {
  const horizontal = horizontalCandidate(topology, point);
  const vertical = verticalCandidate(topology, point);
  const closest = horizontal.distance <= vertical.distance ? horizontal : vertical;
  return closest.distance <= maxDistance ? closest.edge : null;
};
