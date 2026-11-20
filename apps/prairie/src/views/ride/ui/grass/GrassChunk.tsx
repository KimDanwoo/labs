import type { grassLodForRing } from '@views/ride/model/grass/constants';
import { useGrassChunk } from '@views/ride/model/hooks/useGrassChunk';
import { memo, useRef } from 'react';
import { type BufferGeometry, type InstancedMesh, type ShaderMaterial } from 'three';

export interface GrassChunkAssets {
  geometries: Map<number, BufferGeometry>;
  material: ShaderMaterial;
  fullPool: number;
}

interface GrassChunkProps {
  cellX: number;
  cellZ: number;
  seed: number;
  lod: ReturnType<typeof grassLodForRing>;
  assets: GrassChunkAssets;
}

export const GrassChunk = memo(function GrassChunk({ cellX, cellZ, seed, lod, assets }: GrassChunkProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const geometry = assets.geometries.get(lod.segments)!;
  const chunkGeometry = useGrassChunk(meshRef, geometry, {
    cellX,
    cellZ,
    seed,
    bladesPerChunk: lod.blades,
    fullPool: assets.fullPool,
  });
  return <instancedMesh ref={meshRef} args={[chunkGeometry, assets.material, lod.blades]} />;
});

GrassChunk.displayName = 'GrassChunk';
