import type { Point } from '@views/drive/lib/engine/game/world/layout/islandLayout';

const CATMULL_ROM_HALF = 0.5;

function wrapped(points: readonly Point[], index: number): Point {
  const point = points[(index + points.length) % points.length];
  if (!point) throw new Error('곡선 점이 비어 있어요.');
  return point;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    CATMULL_ROM_HALF *
    (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t3)
  );
}

export function closedCurve(points: readonly Point[], samplesPerSpan: number): Point[] {
  return [...points.keys()].flatMap((index) => {
    const [p0, p1, p2, p3] = [-1, 0, 1, 2].map((offset) => wrapped(points, index + offset));
    if (!p0 || !p1 || !p2 || !p3) return [];
    return Array.from({ length: samplesPerSpan }, (_, step): Point => {
      const t = step / samplesPerSpan;
      return [catmullRom(p0[0], p1[0], p2[0], p3[0], t), catmullRom(p0[1], p1[1], p2[1], p3[1], t)];
    });
  });
}

export function segmentDistance(point: Point, from: Point, to: Point): number {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared === 0 ? 0 : ((point[0] - from[0]) * dx + (point[1] - from[1]) * dz) / lengthSquared;
  const clamped = Math.min(1, Math.max(0, t));
  return Math.hypot(point[0] - (from[0] + dx * clamped), point[1] - (from[1] + dz * clamped));
}

export function loopDistance(point: Point, loop: readonly Point[]): number {
  return loop.reduce(
    (nearest, from, index) => Math.min(nearest, segmentDistance(point, from, wrapped(loop, index + 1))),
    Number.POSITIVE_INFINITY,
  );
}

function isInsideLoop(point: Point, loop: readonly Point[]): boolean {
  return loop.reduce((inside, from, index) => {
    const to = wrapped(loop, index + 1);
    const crosses = from[1] > point[1] !== to[1] > point[1];
    if (!crosses) return inside;
    const edgeX = from[0] + ((point[1] - from[1]) / (to[1] - from[1])) * (to[0] - from[0]);
    return point[0] < edgeX ? !inside : inside;
  }, false);
}

export function signedLoopDistance(point: Point, loop: readonly Point[]): number {
  const distance = loopDistance(point, loop);
  return isInsideLoop(point, loop) ? distance : -distance;
}
