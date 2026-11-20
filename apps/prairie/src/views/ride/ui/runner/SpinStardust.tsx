'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, InstancedMesh, Object3D } from 'three';
import { COLORS, COUNT, createStardustState, makeStarGeometry, stepStardust } from '../../lib/runner/spinStardust';

export function SpinStardust() {
  const meshRef = useRef<InstancedMesh>(null);
  const state = useMemo(() => createStardustState(), []);
  const dummy = useMemo(() => new Object3D(), []);
  const geometry = useMemo(() => makeStarGeometry(), []);
  const colors = useMemo(() => COLORS.map((color) => new Color(color)), []);

  useFrame(({ camera }, rawDelta) => {
    if (meshRef.current) stepStardust(state, meshRef.current, dummy, colors, camera.quaternion, rawDelta);
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, COUNT]} frustumCulled={false}>
      <meshBasicMaterial transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}
