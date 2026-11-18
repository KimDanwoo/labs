'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh } from 'three';
import { terrainHeightAt } from '../../config/scene';
import { SLOPE_SAMPLE, across, along, basis, normal, shadowMaterial } from '../../lib/runner/groundShadow';
import { runnerState } from '../../model/ride-state/runnerState';
import { GROUND_SHADOW } from '../../model/runner/constants';

export function GroundShadow() {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { position, heading, airborneHeight } = runnerState;
    const lift = Math.min(airborneHeight / GROUND_SHADOW.fadeHeight, 1);
    mesh.position.set(position.x, position.y - airborneHeight + GROUND_SHADOW.hover, position.z);
    // 지형 경사를 따라 눕힌다: 수치 기울기로 법선을 만들고, 진행 방향을 접평면에 투영해 긴 축(로컬 y)으로, 법선을 로컬 z로 둔다.
    // lookAt은 법선이 수직일 때와 아닐 때 기준축이 달라져 회전이 어긋난다 → 기저를 직접 만든다.
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
