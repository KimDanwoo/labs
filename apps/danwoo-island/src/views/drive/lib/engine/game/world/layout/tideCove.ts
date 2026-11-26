export const COVE = {
  x: 34,
  z: 88,
  rx: 32,
  rz: 7.2,
  drop: 0.93,
  islandX: 48,
  islandZ: 87.8,
  islandRadiusX: 11.8,
  islandRadiusZ: 5.6,
  towerX: 54,
  towerZ: 88.6,
  startX: 8,
  roadHalfWidth: 2.2,
  floorScale: 1.5,
} as const;

export function roadZ(x: number): number {
  const t = Math.min(1, Math.max(0, (x - COVE.startX) / (COVE.islandX - COVE.startX)));
  return COVE.islandZ - 2 * Math.sin(t * Math.PI);
}

export function tideWeight(x: number, z: number): number {
  const radius = Math.max(Math.abs((x - COVE.x) / COVE.rx), Math.abs((z - COVE.z) / COVE.rz));
  const t = Math.max(0, Math.min(1, (1.2 - radius) / 0.2));
  return t * t * (3 - 2 * t);
}

export function hiddenCoveDepth(x: number, z: number): number {
  const radius = Math.hypot((x - COVE.x) / COVE.rx, (z - COVE.z) / COVE.rz);
  const t = Math.min(1, Math.max(0, (1.06 - radius) / 0.24));
  const approach = Math.min(1, Math.max(0, (x - COVE.startX) / 6));
  return t * t * (3 - 2 * t) * approach;
}

export function islandRadius(x: number, z: number): number {
  return Math.hypot((x - COVE.islandX) / COVE.islandRadiusX, (z - COVE.islandZ) / COVE.islandRadiusZ);
}

export function coveBed(x: number, z: number, natural: number): number {
  const radius = Math.hypot((x - COVE.x) / COVE.rx, (z - COVE.z) / COVE.rz);
  if (radius >= 1) return natural;
  const approach = Math.min(1, Math.max(0, (x - COVE.startX - 0.5) / 5));
  const basin = Math.min(1, (1 - radius) * 5) * approach;
  const island = Math.max(0, Math.min(1, (islandRadius(x, z) - 1) * 3));
  const cross = Math.min(1, Math.max(0, Math.abs(z - roadZ(x)) - COVE.roadHalfWidth));
  const bed = x < COVE.islandX ? 0.56 + 0.44 * cross : 1;
  return natural * (1 - basin) + island * bed * basin;
}
