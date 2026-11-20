'use client';

import { useFrame } from '@react-three/fiber';
import { SLOPE_SAMPLE, across, along, basis, normal, shadowMaterial } from '@views/ride/lib/runner/groundShadow';
import { terrainHeightAt } from '@views/ride/lib/scene/terrain';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { GROUND_SHADOW } from '@views/ride/model/runner/constants';
import { useRef } from 'react';
import { Mesh } from 'three';

export function GroundShadow() {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { position, heading, airborneHeight } = runnerState;
    const lift = Math.min(airborneHeight / GROUND_SHADOW.fadeHeight, 1);
    mesh.position.set(position.x, position.y - airborneHeight + GROUND_SHADOW.hover, position.z);
    const dhdx =
      (terrainHeightAt(position.x + SLOPE_SAMPLE, position.z) -
        terrainHeightAt(position.x - SLOPE_SAMPLE, position.z)) /
      (2 * SLOPE_SAMPLE);
    const dhdz =
      (terrainHeightAt(position.x, position.z + SLOPE_SAMPLE) -
        terrainHeightAt(position.x, position.z - SLOPE_SAMPLE)) /
      (2 * SLOPE_SAMPLE);
    normal.set(-dhdx, 1, -dhdz).normalize();
    along.set(Math.sin(heading), 0, Math.cos(heading));
    along.addScaledVector(normal, -along.dot(normal)).normalize();
    across.crossVectors(along, normal);
    mesh.quaternion.setFromRotationMatrix(basis.makeBasis(across, along, normal));
    const spread = 1 + lift * GROUND_SHADOW.airSpread;
    mesh.scale.set(spread, spread, 1);
    shadowMaterial.uniforms.uOpacity!.value = GROUND_SHADOW.opacity * (1 - lift);
  });

  return (
    <mesh ref={meshRef} material={shadowMaterial} renderOrder={GROUND_SHADOW.renderOrder}>
      <planeGeometry args={[GROUND_SHADOW.width, GROUND_SHADOW.length]} />
    </mesh>
  );
}
