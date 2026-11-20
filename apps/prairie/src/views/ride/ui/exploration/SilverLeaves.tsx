'use client';

import { useFrame } from '@react-three/fiber';
import { SILVER_LEAVES } from '@views/ride/config/silverLeaves';
import { advanceDrift, nearbyShare, placeSilverLeaves } from '@views/ride/lib/exploration/silverLeaves';
import { LANDMARKS } from '@views/ride/model/exploration/world';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { useLowDetail } from '@views/ride/model/ride-state/sceneQuality';
import { useRef } from 'react';
import { DoubleSide, InstancedMesh, Object3D } from 'three';

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
