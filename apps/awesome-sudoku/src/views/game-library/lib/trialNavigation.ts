export type TrialStep = -1 | 1;

interface Point {
  x: number;
  y: number;
}

export function stepPosition(current: number, step: TrialStep, length: number): number {
  return (current + step + length) % length;
}

const KEY_TARGET: Record<string, (current: number, length: number) => number> = {
  ArrowLeft: (current, length) => stepPosition(current, -1, length),
  ArrowRight: (current, length) => stepPosition(current, 1, length),
  Home: () => 0,
  End: (_current, length) => length - 1,
};

export function keyToPosition(key: string, current: number, length: number): number | null {
  const target = KEY_TARGET[key];
  return target ? target(current, length) : null;
}

export function swipeStep(start: Point, end: Point, minDistance: number): TrialStep | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const isSwipe = Math.abs(dx) >= minDistance && Math.abs(dx) > Math.abs(dy);
  if (!isSwipe) return null;
  return dx < 0 ? 1 : -1;
}

export function centeredScrollLeft(itemLeft: number, itemWidth: number, containerWidth: number): number {
  return Math.max(0, itemLeft - (containerWidth - itemWidth) / 2);
}
