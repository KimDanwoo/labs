'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { DoubleSide, InstancedMesh, Object3D } from 'three';
import { SILVER_LEAVES } from '../../config/silverLeaves';
import { advanceDrift, nearbyShare, placeSilverLeaves } from '../../lib/exploration/silverLeaves';
import { LANDMARKS } from '../../model/exploration/world';
import { runnerState } from '../../model/ride-state/runnerState';
import { useLowDetail } from '../../model/ride-state/sceneQuality';

export function SilverLeaves() {
  const mobile = useLowDetail();
  const count = mobile ? SILVER_LEAVES.count.mobile : SILVER_LEAVES.count.desktop;
  const leaves = useRef<InstancedMesh>(null);
  const driftTime = useRef(0);
  const dummy = useRef(new Object3D());
  useFrame(({ clock }, delta) => {
    if (!leaves.current) return;
    driftTime.current = advanceDrift(driftTime.current, delta, nearbyShare(runnerState.position, LANDMARKS[0]));
    placeSilverLeaves(leaves.current, dummy.current, count, driftTime.current, clock.elapsedTime);
  });
  return (
    <instancedMesh ref={leaves} args={[undefined, undefined, count]} frustumCulled={false}>
      <octahedronGeometry args={SILVER_LEAVES.geometry} />
      <meshStandardMaterial roughness={SILVER_LEAVES.roughness} side={DoubleSide} />
    </instancedMesh>
  );
}
