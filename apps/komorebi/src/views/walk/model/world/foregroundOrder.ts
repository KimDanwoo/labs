import type { Foreground } from './foreground';
import type { Point, Region } from './world';

export function isForegroundInFront(layer: Foreground, position: Point, region: Region) {
  if (layer.region !== region) return false;
  const [[x1, y1], [x2, y2]] = layer.baseline;
  const x = position.x * 15.36;
  const t = x2 === x1 ? 0 : Math.max(0, Math.min(1, (x - x1) / (x2 - x1)));
  const groundY = y1 + (y2 - y1) * t;
  // Use grounded feet, never head height or the animated jump position.
  return position.z * 10.24 < groundY;
}

export type Walker = Point & { order: number };
const LIFT = 0.05;

export function foregroundOrder(layer: Foreground, walkers: Walker[], region: Region): number | null {
  const hidden = walkers.filter((walker) => isForegroundInFront(layer, walker, region));
  if (hidden.length === 0) return null;
  const behind = Math.max(...hidden.map((walker) => walker.order));
  const inFront = walkers.filter((walker) => !isForegroundInFront(layer, walker, region)).map((walker) => walker.order);
  const nearestFront = Math.min(...inFront);
  const gap = nearestFront - behind;
  return behind + (gap > 0 ? Math.min(LIFT, gap / 2) : LIFT);
}
