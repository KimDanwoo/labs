import type { RovingStep } from '@shared/lib/rovingIndex';

interface Point {
  x: number;
  y: number;
}

export function swipeStep(start: Point, end: Point, minDistance: number): RovingStep | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const isSwipe = Math.abs(dx) >= minDistance && Math.abs(dx) > Math.abs(dy);
  if (!isSwipe) return null;
  return dx < 0 ? 1 : -1;
}

export function centeredScrollLeft(itemLeft: number, itemWidth: number, containerWidth: number): number {
  return Math.max(0, itemLeft - (containerWidth - itemWidth) / 2);
}
