export const LANDMARKS = [
  { id: 'elder', name: '바람의 나무', description: '은빛 잎 아래에서 시작하는 작은 여행.', x: -14, z: 85, radius: 25 },
  {
    id: 'garden',
    name: '꽃잠 정원',
    description: '오래된 돌기둥 사이로 꽃이 돌아온 자리.',
    x: -65,
    z: 205,
    radius: 28,
  },
  { id: 'arch', name: '노을의 문', description: '초원의 끝을 향해 열린 돌 아치.', x: 5, z: 340, radius: 28 },
] as const;

// Height is relative to terrain; every gate faces the route's forward (+Z) direction.
export const GATES = [
  { x: 0, z: 62, height: 21 },
  { x: -10, z: 110, height: 25 },
  { x: -35, z: 155, height: 27 },
  { x: -55, z: 205, height: 24 },
  { x: -35, z: 250, height: 28 },
  { x: -10, z: 295, height: 26 },
  { x: 5, z: 340, height: 23 },
] as const;
export const GATE_RADIUS = 4.5;
export type Point = { x: number; y: number; z: number };

// Segment/plane intersection prevents a fast dash from skipping a gate between frames.
export function crossesGate(from: Point, to: Point, center: Point): boolean {
  if (from.z >= center.z || to.z < center.z) return false;
  const t = (center.z - from.z) / (to.z - from.z);
  return Math.hypot(from.x + (to.x - from.x) * t - center.x, from.y + (to.y - from.y) * t - center.y) < GATE_RADIUS;
}

export function isExplorationClearing(x: number, z: number): boolean {
  return (
    LANDMARKS.some((place) => Math.hypot(x - place.x, z - place.z) < 20) ||
    GATES.some((gate) => Math.hypot(x - gate.x, z - gate.z) < 9)
  );
}

export function parseProgress(raw: string | null): { discovered: string[]; best: number | null } {
  try {
    const data = JSON.parse(raw ?? '{}');
    return {
      discovered: Array.isArray(data?.discovered)
        ? LANDMARKS.filter((place) => data.discovered.includes(place.id)).map((place) => place.id)
        : [],
      best: typeof data?.best === 'number' && Number.isFinite(data.best) && data.best > 0 ? data.best : null,
    };
  } catch {
    return { discovered: [], best: null };
  }
}
