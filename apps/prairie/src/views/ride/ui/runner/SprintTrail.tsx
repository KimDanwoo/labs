'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, InstancedMesh } from 'three';
import { SPRINT_TRAIL_VIEW } from '../../config/sprintTrailView';
import { maxMotes } from '../../lib/runner/sprintTrail';
import { createMoteState, stepSprintTrail } from '../../lib/runner/sprintTrailStep';
import { SPRINT_TRAIL } from '../../model/runner/constants';

// 질주(Shift)·비행 중 발굽 근처에서 금빛 잔광이 튀어 뒤로 흘러간다. world 공간, 죽은 입자는 크기 0.
export function SprintTrail() {
  const meshRef = useRef<InstancedMesh>(null);
  const motes = useMemo(() => createMoteState(), []);

  useFrame((_state, rawDelta) => {
    if (meshRef.current) stepSprintTrail(motes, meshRef.current, rawDelta);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxMotes]} frustumCulled={false}>
      <sphereGeometry args={SPRINT_TRAIL_VIEW.moteGeometry} />
      <meshBasicMaterial color={SPRINT_TRAIL.color} transparent blending={AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}
