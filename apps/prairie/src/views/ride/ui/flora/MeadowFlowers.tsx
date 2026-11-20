'use client';

import { useFrame } from '@react-three/fiber';
import { MEADOW_FLOWERS } from '@views/ride/config/meadowFlowersView';
import { makeFlowerGeometry } from '@views/ride/lib/flora/makeFlowerGeometry';
import { liftToBase, rebuildMeadowFlowers } from '@views/ride/lib/flora/meadowFlowerPlacement';
import { TILE } from '@views/ride/lib/flora/meadowFlowers';
import { useLowDetail } from '@views/ride/model/ride-state/sceneQuality';
import { useMemo, useRef } from 'react';
import { InstancedMesh, Object3D } from 'three';

export function MeadowFlowers() {
  const coarse = useLowDetail();
  const radius = coarse ? MEADOW_FLOWERS.radius.coarse : MEADOW_FLOWERS.radius.fine;
  const perCell = coarse ? MEADOW_FLOWERS.perCell.coarse : MEADOW_FLOWERS.perCell.fine;
  const capacity = (radius * 2 + 1) ** 2 * perCell;
  const stems = useRef<InstancedMesh>(null);
  const flowers = useRef<InstancedMesh>(null);
  const center = useRef({ x: NaN, z: NaN, capacity: 0 });
  const geometry = useMemo(() => makeFlowerGeometry(), []);
  const dummyRef = useRef(new Object3D());
  useFrame(({ camera }) => {
    if (!stems.current) return;
    if (!flowers.current) return;
    const cx = Math.floor(camera.position.x / TILE),
      cz = Math.floor(camera.position.z / TILE);
    const isSameLayout = cx === center.current.x && cz === center.current.z && capacity === center.current.capacity;
    if (isSameLayout) return;
    center.current = { x: cx, z: cz, capacity };
    const meshes = { stems: stems.current, flowers: flowers.current };
    rebuildMeadowFlowers(meshes, dummyRef.current, { x: cx, z: cz }, { radius, perCell });
  });
  return (
    <group>
      <instancedMesh ref={stems} args={[undefined, undefined, capacity]}>
        <cylinderGeometry args={MEADOW_FLOWERS.stemGeometry} onUpdate={liftToBase} />
        <meshLambertMaterial color="#526b38" />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[geometry, undefined, capacity]}>
        <meshLambertMaterial vertexColors />
      </instancedMesh>
    </group>
  );
}
