'use client';

import { GrassField } from '@entities/grass/ui';
import { River } from '@entities/river/ui';
import { Ground, Scenery } from '@entities/scenery/ui';
import { RunnerRig } from '@features/runner-control/ui';
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { CAMERA, FOG, SCENE_COLORS, SUN, type FogQuality } from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { Suspense, useState } from 'react';
import { ReadySignal } from './ReadySignal';

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
      dpr={dpr}
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

      <ambientLight color={SCENE_COLORS.ambient} intensity={SUN.ambientIntensity} />
      <directionalLight color={SCENE_COLORS.sunLight} intensity={SUN.intensity} position={SUN.position} />

      <Suspense fallback={null}>
        <Scenery />
        <Ground />
        <River />
        <GrassField />
        <RunnerRig />
        <ReadySignal />
      </Suspense>
    </Canvas>
  );
}
