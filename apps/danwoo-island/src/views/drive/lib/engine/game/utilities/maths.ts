export interface Point2 {
  x: number;
  y: number;
}

export interface Circle {
  center: Point2;
  radius: number;
}

export type Range = readonly [number, number];

const TAU = 2 * Math.PI;

export function clamp(input: number, min: number, max: number): number {
  return Math.max(min, Math.min(input, max));
}

export function remap(input: number, [inLow, inHigh]: Range, [outLow, outHigh]: Range): number {
  return ((input - inLow) * (outHigh - outLow)) / (inHigh - inLow) + outLow;
}

export function remapClamp(input: number, from: Range, to: Range): number {
  return clamp(remap(input, from, to), Math.min(...to), Math.max(...to));
}

export function lerp(start: number, end: number, ratio: number): number {
  return (1 - ratio) * start + ratio * end;
}

export function smoothstep(value: number, min: number, max: number): number {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

export function safeMod(value: number, modulo: number): number {
  return ((value % modulo) + modulo) % modulo;
}

export function signedModDelta(from: number, to: number, modulo: number): number {
  const delta = (to - from + modulo) % modulo;
  return delta > modulo / 2 ? delta - modulo : delta;
}

export function smallestAngle(current: number, target: number): number {
  return safeMod(target - current + Math.PI, TAU) - Math.PI;
}

export function segmentCircleIntersection(start: Point2, end: Point2, { center, radius }: Circle): Point2[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const fx = start.x - center.x;
  const fy = start.y - center.y;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];

  const root = Math.sqrt(discriminant);
  const near = (-b - root) / (2 * a);
  const far = (-b + root) / (2 * a);
  const isOnSegment = (t: number): boolean => t >= 0 && t <= 1;
  const pointAt = (t: number): Point2 => ({ x: start.x + t * dx, y: start.y + t * dy });

  const intersections: Point2[] = [];
  if (isOnSegment(near)) intersections.push(pointAt(near));
  if (isOnSegment(far) && discriminant !== 0) intersections.push(pointAt(far));
  return intersections;
}

function dist(a: Point2, b: Point2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function closestOnSegment(start: Point2, end: Point2, point: Point2): Point2 {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  if (t < 0) return start;
  if (t > 1) return end;
  return { x: start.x + t * dx, y: start.y + t * dy };
}

function segmentTouchesCircle(start: Point2, end: Point2, { center, radius }: Circle): boolean {
  return dist(closestOnSegment(start, end, center), center) <= radius;
}

function edgesOf(polygon: readonly Point2[]): [Point2, Point2][] {
  return polygon.map((point, index) => [point, polygon[(index + 1) % polygon.length] ?? point]);
}

function pointInPolygon(point: Point2, polygon: readonly Point2[]): boolean {
  return edgesOf(polygon).reduce((inside, [current, next]) => {
    const crossesY = current.y > point.y !== next.y > point.y;
    const crossX = ((next.x - current.x) * (point.y - current.y)) / (next.y - current.y) + current.x;
    return crossesY && point.x < crossX ? !inside : inside;
  }, false);
}

export function circleIntersectsPolygon(circle: Circle, polygon: readonly Point2[]): boolean {
  if (polygon.some((point) => dist(point, circle.center) <= circle.radius)) return true;
  if (edgesOf(polygon).some(([start, end]) => segmentTouchesCircle(start, end, circle))) return true;
  return pointInPolygon(circle.center, polygon);
}
