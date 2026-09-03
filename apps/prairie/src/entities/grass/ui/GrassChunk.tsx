import { GRASS_FIELD } from '@entities/grass/model/constants';
import { distanceToRiver, RIVER, RIVER_TRENCH_HALF_WIDTH, riverBedDepthAt } from '@shared/config';
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  type BufferGeometry,
  InstancedBufferAttribute,
  type InstancedMesh,
  MathUtils,
  Object3D,
  type ShaderMaterial,
} from 'three';

type GrassChunkProps = {
  cellX: number;
  cellZ: number;
  seed: number;
  geometry: BufferGeometry;
  material: ShaderMaterial;
  bladesPerChunk: number;
  // 첫 링 풀. aLodIndex = i / fullPool → 풀이 달라도 같은 인덱스는 같은 비율.
  fullPool: number;
};

// 시드 기반 결정적 PRNG(mulberry32) — 셀마다 항상 같은 잔디 배치.
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 저주파 군집 노이즈 — 키 큰/낮은 잔디가 자연스러운 덩어리를 이룬다.
function clumpAt(x: number, z: number): number {
  const s = Math.sin(x * 0.13 + z * 0.07) * Math.cos(x * 0.05 - z * 0.11);
  return s * 0.5 + 0.5;
}

// 카메라 주변 한 청크. 셀 좌표(원시값) 의존 → 부모 리렌더로 재생성되지 않는다(memo). 링이 바뀌면 blade 수가 달라져 재생성된다.
// 인스턴스별 LOD 인덱스는 지오메트리 속성이라 청크마다 공유 지오메트리를 얕게 복제해 붙인다.
export const GrassChunk = memo(function GrassChunk({
  cellX,
  cellZ,
  seed,
  geometry,
  material,
  bladesPerChunk,
  fullPool,
}: GrassChunkProps) {
  const meshRef = useRef<InstancedMesh>(null);

  const chunkGeometry = useMemo(() => {
    const cloned = geometry.clone();
    const lodIndex = new Float32Array(bladesPerChunk);
    for (let i = 0; i < bladesPerChunk; i += 1) lodIndex[i] = i / fullPool;
    cloned.setAttribute('aLodIndex', new InstancedBufferAttribute(lodIndex, 1));
    return cloned;
  }, [geometry, bladesPerChunk, fullPool]);

  useEffect(() => () => chunkGeometry.dispose(), [chunkGeometry]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const centerX = cellX * GRASS_FIELD.tile;
    const centerZ = cellZ * GRASS_FIELD.tile;
    const rng = makeRng(seed);
    const dummy = new Object3D();
    for (let i = 0; i < bladesPerChunk; i += 1) {
      const x = centerX + (rng() - 0.5) * GRASS_FIELD.tile;
      const z = centerZ + (rng() - 0.5) * GRASS_FIELD.tile;
      const riverDist = distanceToRiver(x);
      dummy.position.set(x, -riverBedDepthAt(riverDist), z);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      const scale = GRASS_FIELD.minScale + rng() * (GRASS_FIELD.maxScale - GRASS_FIELD.minScale);
      const clump = 0.65 + clumpAt(x, z) * 0.7;
      const jitter = 0.85 + rng() * 0.4;
      // 강둑 경사 윗부분(grassOverhang)까지 잔디가 넘어오고, 거기서 grassFade 폭에 걸쳐 성겨지며 키도 낮아진다.
      // 골 안쪽은 비운다. 지우는 대신 크기 0(인스턴스 수 고정).
      const riverward = (riverDist - (RIVER_TRENCH_HALF_WIDTH - RIVER.grassOverhang)) / RIVER.grassFade;
      const isBare = rng() > riverward;
      const height = scale * clump * jitter * MathUtils.lerp(RIVER.grassMinHeight, 1, MathUtils.clamp(riverward, 0, 1));
      if (isBare) dummy.scale.set(0, 0, 0);
      else dummy.scale.set(scale, height, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [cellX, cellZ, seed, bladesPerChunk]);

  return <instancedMesh ref={meshRef} args={[chunkGeometry, material, bladesPerChunk]} />;
});
