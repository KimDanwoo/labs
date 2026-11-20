'use client';

import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from '@shared/lib/useReducedMotion';
import { SPRINT_TRAIL_VIEW } from '@views/ride/config/sprintTrailView';
import { maxMotes } from '@views/ride/lib/runner/sprintTrail';
import { createMoteState, stepSprintTrail } from '@views/ride/lib/runner/sprintTrailStep';
import { SPRINT_TRAIL } from '@views/ride/model/runner/constants';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, InstancedMesh } from 'three';

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
