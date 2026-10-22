'use client';

import { FloraField } from '@entities/flora/ui';
import { GrassField } from '@entities/grass/ui';
import { River } from '@entities/river/ui';
import { Ground, Scenery } from '@entities/scenery/ui';
import { Grazers, WingedLife } from '@entities/wildlife/ui';
import { RunnerRig } from '@features/runner-control/ui';
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { CAMERA, FOG, SCENE_COLORS, SUN, type FogQuality } from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { Suspense, useState } from 'react';
import { PCFShadowMap } from 'three';
import { ReadySignal } from './ReadySignal';
import { RideSun } from './RideSun';
import { SceneFailure } from './SceneBoundary';

const DPR = {
  desktop: { max: 1.5, min: 1 },
  mobile: { max: 1.25, min: 0.8 },
} as const;

export function SceneCanvas() {
  const coarse = useIsCoarsePointer();
  const quality: FogQuality = coarse ? 'mobile' : 'desktop';
  const fog = FOG[quality];
  const dprRange = DPR[quality];
  // 프레임이 떨어지면 해상도를 낮추고, 여유가 생기면 되돌린다(적응형 DPR).
  const [dpr, setDpr] = useState<number>(dprRange.max);

  return (
    <Canvas
      className="cursor-grab"
      fallback={<SceneFailure />}
      dpr={dpr}
      shadows={{ type: PCFShadowMap }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
        position: [0, CAMERA.followHeight, -CAMERA.followDistance],
      }}
    >
      <PerformanceMonitor onDecline={() => setDpr(dprRange.min)} onIncline={() => setDpr(dprRange.max)} />
      <fog attach="fog" args={[SCENE_COLORS.fog, fog.near, fog.far]} />

      <hemisphereLight color={SCENE_COLORS.ambient} groundColor={SCENE_COLORS.grass} intensity={SUN.ambientIntensity} />
      <RideSun mobile={coarse} />

      <Suspense fallback={null}>
        <Scenery />
        <Ground />
        <River />
        <GrassField />
        <FloraField />
        <RunnerRig />
        <Grazers />
        <WingedLife kind="bird" />
        <WingedLife kind="dragonfly" />
        <ReadySignal />
      </Suspense>
    </Canvas>
  );
}
