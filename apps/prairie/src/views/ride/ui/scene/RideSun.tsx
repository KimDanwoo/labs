'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { Object3D } from 'three';
import { SUN } from '../../config/scene';
import { makeRideSun } from '../../lib/scene/makeRideSun';
import { useDispose } from '../../model/hooks/useDispose';
import { runnerState } from '../../model/ride-state/runnerState';

interface RideSunProps {
  mobile: boolean;
}

// A compact shadow volume follows the rider instead of covering the entire world.
export function RideSun({ mobile }: RideSunProps) {
  const target = useMemo(() => new Object3D(), []);
  const light = useMemo(() => makeRideSun(mobile, target), [mobile, target]);
  useDispose(light);
  useFrame(() => {
    target.position.copy(runnerState.position);
    light.position.set(
      target.position.x + SUN.position[0],
      target.position.y + SUN.position[1],
      target.position.z + SUN.position[2],
    );
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={light} />
      <primitive object={target} />
    </>
  );
}
