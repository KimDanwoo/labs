'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, DoubleSide, InstancedMesh, Object3D } from 'three';
import { RIVER_BANKS_VIEW } from '../../config/riverBanksView';
import { makeBladeGeometry } from '../../lib/makeBladeGeometry';
import { bankKey, rebuildBanks } from '../../lib/river/riverBankPlacement';
import { CAPACITY } from '../../lib/river/riverBanks';
import { useDispose } from '../../model/hooks/useDispose';
import { useLowDetail } from '../../model/ride-state/sceneQuality';

// A small, deterministic pool adds irregular shoreline landmarks without a mesh per stone/stem.
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
    if (!rocks.current || !reeds.current) return;
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
