import { type Point } from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';

export interface Raggedness {
  readonly cell: number;
  readonly reach: number;
}

const ease = (value: number): number => value * value * (3 - 2 * value);

function latticeValue(column: number, row: number): number {
  const mixed = Math.imul(Math.imul(column, 0x27d4eb2d) ^ Math.imul(row, 0x165667b1), 0x9e3779b1);
  return ((mixed ^ (mixed >>> 15)) >>> 0) / 2 ** 32;
}

export function valueNoise([x, z]: Point, cell: number): number {
  const column = Math.floor(x / cell);
  const row = Math.floor(z / cell);
  const across = ease(x / cell - column);
  const down = ease(z / cell - row);
  const north = latticeValue(column, row) * (1 - across) + latticeValue(column + 1, row) * across;
  const south = latticeValue(column, row + 1) * (1 - across) + latticeValue(column + 1, row + 1) * across;
  return north * (1 - down) + south * down;
}

export const ragged = (point: Point, { cell, reach }: Raggedness): number =>
  (valueNoise(point, cell) - 0.5) * 2 * reach;
