import { distanceToRiver, RIVER_TRENCH_HALF_WIDTH } from '@shared/config';

// 나무·바위 배치. 셀 좌표 해시만으로 결정되므로 어디서 다시 와도 같은 자리에 같은 나무가 선다(저장 없음).
// 렌더(FloraField)와 충돌(RunnerRig)이 같은 함수를 쓴다.
export const FLORA = {
  cell: 32,
  // 안개 너머는 어차피 안 보인다. 기기별 셀 반경(cell 단위).
  viewRadius: { desktop: 7, mobile: 3 },
  // 강 골 가장자리에서 이만큼은 비운다(강둑·범람원).
  riverMargin: 10,
  // 스폰 지점 주변은 비워 둔다.
  spawnClearRadius: 30,
  trunk: { radiusTop: 0.14, radiusBottom: 0.36, height: 4.1, segments: 9 },
  // 활엽수 수관: 거친 곡면 잎 군집을 비대칭으로 분산하고 일부 군집까지 가지를 뻗는다.
  canopy: { radius: 2.2, detail: 2, blobs: 11 },
  branches: 5,
  // 침엽수: 원뿔 tiers단. 아래가 넓고 위로 좁아진다.
  conifer: { radius: 2.1, tierHeight: 1.8, tiers: 6, segments: 13 },
  rock: { radius: 0.9, detail: 0 },
  // 캐노피 바람 흔들림(m)과 세로 명암(아래 어둡게 → 위 밝게).
  sway: 0.07,
  shadeBottom: 0.72,
  shadeTop: 1.1,
  // 말 충돌 반경(줄기 반지름에 더한다).
  runnerRadius: 0.8,
  maxTrees: 600,
  maxRocks: 400,
  colors: {
    trunk: '#66513b',
    canopy: ['#536b39', '#6d8047', '#455e35', '#829055'],
    conifer: ['#48654b', '#5d7953'],
    rock: '#8d8779',
  },
} as const;

export type FloraKind = 'tree' | 'conifer' | 'rock';

export type FloraPlacement = {
  kind: FloraKind;
  x: number;
  z: number;
  yaw: number;
  scale: number;
  variant: number;
};

function hash2(cellX: number, cellZ: number, salt: number): number {
  let h = (Math.imul(cellX, 73856093) ^ Math.imul(cellZ, 19349663) ^ Math.imul(salt, 83492791)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

function isBlocked(x: number, z: number): boolean {
  if (distanceToRiver(x) < RIVER_TRENCH_HALF_WIDTH + FLORA.riverMargin) return true;
  return Math.hypot(x, z) < FLORA.spawnClearRadius;
}

// 셀 하나의 배치. 나무는 군락(0~4그루), 바위는 0~2개. 각 항목은 셀 안에서 해시로 흩는다.
export function floraInCell(cellX: number, cellZ: number): FloraPlacement[] {
  const out: FloraPlacement[] = [];
  const origin = { x: cellX * FLORA.cell, z: cellZ * FLORA.cell };
  const grove = hash2(cellX, cellZ, 1);
  const treeCount = grove < 0.5 ? 0 : 1 + Math.floor((grove - 0.5) * 8);
  // 군락 단위로 수종이 갈린다 — 섞이면 숲이 아니라 잡동사니로 보인다.
  const kind: FloraKind = hash2(cellX, cellZ, 3) < 0.65 ? 'tree' : 'conifer';
  for (let i = 0; i < treeCount; i += 1) {
    const x = origin.x + (hash2(cellX, cellZ, 10 + i * 3) - 0.5) * FLORA.cell;
    const z = origin.z + (hash2(cellX, cellZ, 11 + i * 3) - 0.5) * FLORA.cell;
    if (isBlocked(x, z)) continue;
    const r = hash2(cellX, cellZ, 12 + i * 3);
    out.push({ kind, x, z, yaw: r * Math.PI * 2, scale: 0.8 + r * 0.8, variant: Math.floor(r * 97) % 4 });
  }
  const rockCount = Math.floor(hash2(cellX, cellZ, 2) * 3);
  for (let i = 0; i < rockCount; i += 1) {
    const x = origin.x + (hash2(cellX, cellZ, 40 + i * 3) - 0.5) * FLORA.cell;
    const z = origin.z + (hash2(cellX, cellZ, 41 + i * 3) - 0.5) * FLORA.cell;
    if (isBlocked(x, z)) continue;
    const r = hash2(cellX, cellZ, 42 + i * 3);
    out.push({ kind: 'rock', x, z, yaw: r * Math.PI * 2, scale: 0.5 + r * 1.2, variant: 0 });
  }
  return out;
}

export function floraCellOf(v: number): number {
  return Math.round(v / FLORA.cell);
}

// 말을 줄기·바위 밖으로 밀어낸다. 주변 3×3 셀만 본다. 밀린 거리(m)를 돌려준다(0이면 충돌 없음).
export function pushOutOfFlora(position: { x: number; z: number }): number {
  const cx = floraCellOf(position.x);
  const cz = floraCellOf(position.z);
  let pushed = 0;
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dz = -1; dz <= 1; dz += 1) {
      for (const item of floraInCell(cx + dx, cz + dz)) {
        const solid = item.kind === 'rock' ? FLORA.rock.radius * item.scale : FLORA.trunk.radiusBottom * item.scale;
        const minDist = solid + FLORA.runnerRadius;
        const ox = position.x - item.x;
        const oz = position.z - item.z;
        const dist = Math.hypot(ox, oz);
        if (dist >= minDist || dist === 0) continue;
        const k = (minDist - dist) / dist;
        position.x += ox * k;
        position.z += oz * k;
        pushed += minDist - dist;
      }
    }
  }
  return pushed;
}
