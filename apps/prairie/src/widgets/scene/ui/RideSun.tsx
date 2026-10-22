'use client';

import { useFrame } from '@react-three/fiber';
import { SCENE_COLORS, SUN } from '@shared/config';
import { runnerState } from '@shared/r3f';
import { useEffect, useMemo } from 'react';
import { DirectionalLight, Object3D } from 'three';

// A compact shadow volume follows the rider instead of covering the entire world.
export function RideSun({ mobile }: { mobile: boolean }) {
  const target = useMemo(() => new Object3D(), []);
  const light = useMemo(() => {
    const sun = new DirectionalLight(SCENE_COLORS.sunLight, SUN.intensity);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 180 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = 0.025;
    sun.shadow.bias = -0.0002;
    sun.shadow.radius = 3;
    sun.target = target;
    return sun;
  }, [mobile, target]);
  useEffect(() => () => light.dispose(), [light]);
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
