'use client';

import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from '@shared/lib/useReducedMotion';
import { SPRINT_TRAIL_VIEW } from '@views/ride/config/sprintTrailView';
import { maxMotes } from '@views/ride/lib/runner/sprintTrail';
import { createMoteState, stepSprintTrail } from '@views/ride/lib/runner/sprintTrailStep';
import { SPRINT_TRAIL } from '@views/ride/model/runner/constants';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, InstancedMesh } from 'three';

// 질주(Shift)·비행 중 발굽 근처에서 금빛 잔광이 튀어 뒤로 흘러간다. world 공간, 죽은 입자는 크기 0. 움직임 줄이기에서는 그리지 않는다.
export function SprintTrail() {
  const isReducedMotion = useReducedMotion();
  const meshRef = useRef<InstancedMesh>(null);
  const motes = useMemo(() => createMoteState(), []);

  useFrame((_state, rawDelta) => {
    if (meshRef.current) stepSprintTrail(motes, meshRef.current, rawDelta);
  });

  if (isReducedMotion) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxMotes]} frustumCulled={false}>
      <sphereGeometry args={SPRINT_TRAIL_VIEW.moteGeometry} />
      <meshBasicMaterial color={SPRINT_TRAIL.color} transparent blending={AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}
