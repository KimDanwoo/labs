import { useLayoutEffect, useRef } from 'react';
import { type BufferGeometry, type InstancedMesh, Object3D, type ShaderMaterial } from 'three';
import { GRASS_FIELD } from '../model/constants';

type GrassChunkProps = {
  cellX: number;
  cellZ: number;
  seed: number;
  geometry: BufferGeometry;
  material: ShaderMaterial;
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

// 카메라 주변 한 청크. 셀 좌표(원시값) 의존 → 부모 리렌더로 재생성되지 않는다.
export function GrassChunk({ cellX, cellZ, seed, geometry, material }: GrassChunkProps) {
  const meshRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const centerX = cellX * GRASS_FIELD.tile;
    const centerZ = cellZ * GRASS_FIELD.tile;
    const rng = makeRng(seed);
    const dummy = new Object3D();
    for (let i = 0; i < GRASS_FIELD.bladesPerChunk; i += 1) {
      const x = centerX + (rng() - 0.5) * GRASS_FIELD.tile;
      const z = centerZ + (rng() - 0.5) * GRASS_FIELD.tile;
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      const scale = GRASS_FIELD.minScale + rng() * (GRASS_FIELD.maxScale - GRASS_FIELD.minScale);
      const clump = 0.65 + clumpAt(x, z) * 0.7;
      dummy.scale.set(scale, scale * clump * (0.85 + rng() * 0.4), scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [cellX, cellZ, seed]);

  return <instancedMesh ref={meshRef} args={[geometry, material, GRASS_FIELD.bladesPerChunk]} />;
}
