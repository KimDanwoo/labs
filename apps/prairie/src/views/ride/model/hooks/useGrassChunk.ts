import { useLayoutEffect, useMemo, type RefObject } from 'react';
import type { BufferGeometry, InstancedMesh } from 'three';
import { fillGrassChunk, makeChunkGeometry, type GrassChunkLayout } from '../../lib/grass/grassChunk';
import { useDispose } from './useDispose';

export function useGrassChunk(
  meshRef: RefObject<InstancedMesh | null>,
  geometry: BufferGeometry,
  layout: GrassChunkLayout,
): BufferGeometry {
  const { cellX, cellZ, seed, bladesPerChunk, fullPool } = layout;
  const chunkGeometry = useMemo(
    () => makeChunkGeometry(geometry, bladesPerChunk, fullPool),
    [geometry, bladesPerChunk, fullPool],
  );
  useDispose(chunkGeometry);
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (mesh) fillGrassChunk(mesh, chunkGeometry, { cellX, cellZ, seed, bladesPerChunk, fullPool });
  }, [meshRef, cellX, cellZ, seed, bladesPerChunk, chunkGeometry, fullPool]);
  return chunkGeometry;
}
