'use client';

import { GrassField } from '@entities/grass/ui';
import { Scenery } from '@entities/scenery/ui';
import { Ground } from '@entities/village/ui';
import { RunnerRig } from '@features/runner-control/ui';
import { Canvas } from '@react-three/fiber';
import { CAMERA, FOG, SCENE_COLORS, SUN } from '@shared/config';
import { Suspense } from 'react';

export function SceneCanvas() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
        position: [0, CAMERA.followHeight, -CAMERA.followDistance],
      }}
    >
      <fog attach="fog" args={[SCENE_COLORS.fog, FOG.near, FOG.far]} />

      <ambientLight color={SCENE_COLORS.ambient} intensity={SUN.ambientIntensity} />
      <directionalLight color={SCENE_COLORS.sunLight} intensity={SUN.intensity} position={SUN.position} />

      <Suspense fallback={null}>
        <Scenery />
        <Ground />
        <GrassField />
        <RunnerRig />
      </Suspense>
    </Canvas>
  );
}
