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

// Sweep a small body volume through the aperture in either direction, including dashes.
export function crossesGate(from: Point, to: Point, center: Point): boolean {
  const depth = 0.65;
  const dz = to.z - from.z;
  let start = 0;
  let end = 1;
  if (Math.abs(dz) < 1e-8) {
    if (Math.abs(from.z - center.z) > depth) return false;
  } else {
    const a = (center.z - depth - from.z) / dz;
    const b = (center.z + depth - from.z) / dz;
    start = Math.max(0, Math.min(a, b));
    end = Math.min(1, Math.max(a, b));
    if (start > end) return false;
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSq = dx * dx + dy * dy;
  const closest = lengthSq > 0 ? ((center.x - from.x) * dx + (center.y - from.y) * dy) / lengthSq : start;
  const t = Math.max(start, Math.min(end, closest));
  return Math.hypot(from.x + dx * t - center.x, from.y + dy * t - center.y) <= GATE_RADIUS + depth;
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
