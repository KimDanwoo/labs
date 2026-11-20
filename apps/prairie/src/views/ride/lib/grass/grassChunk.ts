import { MEADOW_PATH, RIVER, RIVER_TRENCH_HALF_WIDTH } from '@views/ride/config/scene';
import { coastDistanceAt, distanceToRiver, groundHeightAt, meadowPathDistanceAt } from '@views/ride/lib/scene/terrain';
import { GRASS_FIELD } from '@views/ride/model/grass/constants';
import { InstancedBufferAttribute, MathUtils, Object3D, type BufferGeometry, type InstancedMesh } from 'three';

// 시드 기반 결정적 PRNG(mulberry32) — 셀마다 항상 같은 잔디 배치.
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 저주파 군집 노이즈 — 키 큰/낮은 잔디가 자연스러운 덩어리를 이룬다.
export function clumpAt(x: number, z: number): number {
  const s = Math.sin(x * 0.13 + z * 0.07) * Math.cos(x * 0.05 - z * 0.11);
  return s * 0.5 + 0.5;
}

const COAST_LIMIT = -28;
const CLUMP_BASE = 0.75;
const CLUMP_GAIN = 0.4;
const JITTER_BASE = 0.9;
const JITTER_GAIN = 0.3;
const BARE_BASE = 0.1;
const BARE_GAIN = 0.9;
const PATH_MIN_HEIGHT = 0.2;
const WIDTH_BASE = 0.7;
const WIDTH_GAIN = 0.3;

export interface GrassChunkLayout {
  cellX: number;
  cellZ: number;
  seed: number;
  bladesPerChunk: number;
  fullPool: number;
}

export function makeChunkGeometry(geometry: BufferGeometry, bladesPerChunk: number, fullPool: number): BufferGeometry {
  const cloned = geometry.clone();
  const lodIndex = new Float32Array(bladesPerChunk);
  for (let i = 0; i < bladesPerChunk; i += 1) lodIndex[i] = i / fullPool;
  cloned.setAttribute('aLodIndex', new InstancedBufferAttribute(lodIndex, 1));
  return cloned;
}

export function fillGrassChunk(mesh: InstancedMesh, chunkGeometry: BufferGeometry, layout: GrassChunkLayout): void {
  const { cellX, cellZ, seed, bladesPerChunk, fullPool } = layout;
  const centerX = cellX * GRASS_FIELD.tile;
  const centerZ = cellZ * GRASS_FIELD.tile;
  const rng = makeRng(seed);
  const dummy = new Object3D();
  let visible = 0;
  const lodIndex = chunkGeometry.getAttribute('aLodIndex');
  for (let i = 0; i < bladesPerChunk; i += 1) {
    const x = centerX + (rng() - 0.5) * GRASS_FIELD.tile;
    const z = centerZ + (rng() - 0.5) * GRASS_FIELD.tile;
    const riverDist = distanceToRiver(x, z);
    dummy.position.set(x, groundHeightAt(x, z), z);
    // 기울기(X) 뒤에 방향(Y) — 평면 blade가 수직이면 공중에서 내려다볼 때 모서리만 보여 사라진다. 기울여 위에서도 면이 보이게.
    const lean = GRASS_FIELD.minLean + rng() * (GRASS_FIELD.maxLean - GRASS_FIELD.minLean);
    dummy.rotation.set(lean, rng() * Math.PI * 2, 0, 'YXZ');
    const scale = GRASS_FIELD.minScale + rng() * (GRASS_FIELD.maxScale - GRASS_FIELD.minScale);
    const clump = CLUMP_BASE + clumpAt(x, z) * CLUMP_GAIN;
    const jitter = JITTER_BASE + rng() * JITTER_GAIN;
    // 강둑 경사 윗부분(grassOverhang)까지 잔디가 넘어오고, 거기서 grassFade 폭에 걸쳐 성겨지며 키도 낮아진다.
    // 물과 모래사장은 제출할 인스턴스에서 빼되 원래 LOD 인덱스는 보존한다.
    const riverward = (riverDist - (RIVER_TRENCH_HALF_WIDTH - RIVER.grassOverhang)) / RIVER.grassFade;
    const path = MathUtils.smoothstep(
      meadowPathDistanceAt(x, z),
      MEADOW_PATH.halfWidth,
      MEADOW_PATH.halfWidth + MEADOW_PATH.edge,
    );
    const isBare = rng() > riverward || coastDistanceAt(x, z) > COAST_LIMIT || rng() > BARE_BASE + path * BARE_GAIN;
    const height =
      scale *
      clump *
      jitter *
      MathUtils.lerp(PATH_MIN_HEIGHT, 1, path) *
      MathUtils.lerp(RIVER.grassMinHeight, 1, MathUtils.clamp(riverward, 0, 1));
    if (isBare) continue;
    dummy.scale.set(scale * (WIDTH_BASE + clump * WIDTH_GAIN), height, scale);
    dummy.updateMatrix();
    lodIndex.setX(visible, i / fullPool);
    mesh.setMatrixAt(visible++, dummy.matrix);
  }
  mesh.count = visible;
  lodIndex.needsUpdate = true;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}
