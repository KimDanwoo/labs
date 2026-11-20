import { memo, useRef } from 'react';
import { type BufferGeometry, type InstancedMesh, type ShaderMaterial } from 'three';
import { useGrassChunk } from '../../model/hooks/useGrassChunk';

interface GrassChunkProps {
  cellX: number;
  cellZ: number;
  seed: number;
  geometry: BufferGeometry;
  material: ShaderMaterial;
  bladesPerChunk: number;
  // 첫 링 풀. aLodIndex = i / fullPool → 풀이 달라도 같은 인덱스는 같은 비율.
  fullPool: number;
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
  const chunkGeometry = useGrassChunk(meshRef, geometry, { cellX, cellZ, seed, bladesPerChunk, fullPool });
  return <instancedMesh ref={meshRef} args={[chunkGeometry, material, bladesPerChunk]} />;
});

GrassChunk.displayName = 'GrassChunk';
