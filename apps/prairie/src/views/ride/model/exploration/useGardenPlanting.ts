import { useFrame } from '@react-three/fiber';
import { createGardenLayout, swayStemMatrix } from '@views/ride/lib/exploration/gardenPlanting';
import { terrainHeightAt } from '@views/ride/lib/scene/terrain';
import { LANDMARKS } from '@views/ride/model/exploration/world';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Object3D, type InstancedMesh } from 'three';

function gardenLayout() {
  const place = LANDMARKS[1];
  const base = terrainHeightAt(place.x, place.z);
  return createGardenLayout((x, z) => terrainHeightAt(place.x + x, place.z + z) - base);
}

export function useGardenPlanting() {
  const blooms = useRef<InstancedMesh>(null);
  const stems = useRef<InstancedMesh>(null);
  const leaves = useRef<InstancedMesh>(null);
  const layout = useMemo(() => gardenLayout(), []);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const bloomMesh = blooms.current;
    const leafMesh = leaves.current;
    if (!bloomMesh || !leafMesh) return;
    layout.blooms.forEach((matrix, index) => bloomMesh.setMatrixAt(index, matrix));
    layout.bloomColors.forEach((color, index) => bloomMesh.setColorAt(index, color));
    layout.leaves.forEach((matrix, index) => leafMesh.setMatrixAt(index, matrix));
    bloomMesh.instanceMatrix.needsUpdate = true;
    if (bloomMesh.instanceColor) bloomMesh.instanceColor.needsUpdate = true;
    leafMesh.instanceMatrix.needsUpdate = true;
  }, [layout]);

  useFrame(({ clock }) => {
    const stemMesh = stems.current;
    if (!stemMesh) return;
    layout.stems.forEach((stem, index) =>
      stemMesh.setMatrixAt(index, swayStemMatrix(stem, index, clock.elapsedTime, dummy)),
    );
    stemMesh.instanceMatrix.needsUpdate = true;
  });

  return { blooms, stems, leaves };
}
