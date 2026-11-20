'use client';

import { useFrame } from '@react-three/fiber';
import { SUN } from '@views/ride/config/scene';
import { makeRideSun } from '@views/ride/lib/scene/makeRideSun';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { useMemo } from 'react';
import { Object3D } from 'three';

interface RideSunProps {
  mobile: boolean;
}

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
