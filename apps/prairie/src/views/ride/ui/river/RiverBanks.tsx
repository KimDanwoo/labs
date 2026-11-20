'use client';

import { useFrame } from '@react-three/fiber';
import { RIVER_BANKS_VIEW } from '@views/ride/config/riverBanksView';
import { makeBladeGeometry } from '@views/ride/lib/makeBladeGeometry';
import { bankKey, rebuildBanks } from '@views/ride/lib/river/riverBankPlacement';
import { CAPACITY } from '@views/ride/lib/river/riverBanks';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { useLowDetail } from '@views/ride/model/ride-state/sceneQuality';
import { useMemo, useRef } from 'react';
import { Color, DoubleSide, InstancedMesh, Object3D } from 'three';

export function RiverBanks() {
  const coarse = useLowDetail();
  const rocks = useRef<InstancedMesh>(null);
  const reeds = useRef<InstancedMesh>(null);
  const cell = useRef('');
  const dummy = useMemo(() => new Object3D(), []);
  const tint = useMemo(() => new Color(), []);
  const reedGeometry = useMemo(() => makeBladeGeometry(RIVER_BANKS_VIEW.reedBlades), []);
  useDispose(reedGeometry);

  useFrame(({ camera }) => {
    if (!rocks.current) return;
    if (!reeds.current) return;
    const key = bankKey(camera.position, coarse);
    if (key === cell.current) return;
    cell.current = key;
    rebuildBanks({ rocks: rocks.current, reeds: reeds.current }, dummy, tint, camera.position, coarse);
  });

  return (
    <group>
      <instancedMesh ref={rocks} args={[undefined, undefined, CAPACITY]}>
        <icosahedronGeometry args={RIVER_BANKS_VIEW.rockGeometry} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={reeds} args={[reedGeometry, undefined, CAPACITY]}>
        <meshLambertMaterial side={DoubleSide} />
      </instancedMesh>
    </group>
  );
}
