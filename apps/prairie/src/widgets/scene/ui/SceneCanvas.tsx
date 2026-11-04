'use client';

import { FloraField } from '@entities/flora/ui';
import { GrassField } from '@entities/grass/ui';
import { River } from '@entities/river/ui';
import { Ground, Scenery } from '@entities/scenery/ui';
import { Grazers, WingedLife } from '@entities/wildlife/ui';
import { ExplorationScene } from '@features/exploration/ui';
import { RunnerRig } from '@features/runner-control/ui';
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { CAMERA, CINEMATIC, FOG, SCENE_COLORS, SUN, type FogQuality } from '@shared/config';
import { RENDER_PIXELS, useIsCoarsePointer } from '@shared/lib';
import { Suspense, useState } from 'react';
import { PCFShadowMap } from 'three';
import { ReadySignal } from './ReadySignal';
import { RenderBudget } from './RenderBudget';
import { RideSun } from './RideSun';
import { SceneEffects } from './SceneEffects';
import { SceneFailure } from './SceneFailure';

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
      dpr={Math.min(dpr, dprRange.max)}
      shadows={{ type: PCFShadowMap }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
        position: [0, CAMERA.followHeight, -CAMERA.followDistance],
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = CINEMATIC.exposure;
        gl.domElement.setAttribute('aria-label', '유니콘 Rush 3D 초원. WASD로 이동, Space로 비행, 드래그로 시점 회전');
        gl.domElement.tabIndex = 0;
      }}
    >
      <RenderBudget desired={Math.min(dpr, dprRange.max)} pixels={RENDER_PIXELS[quality]} />
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setDpr(dprRange.min)}
        onIncline={() => setDpr(dprRange.max)}
        onFallback={() => setDpr(dprRange.min)}
      />
      <fog attach="fog" args={[SCENE_COLORS.fog, fog.near, fog.far]} />

      <hemisphereLight color={SCENE_COLORS.ambient} groundColor={SCENE_COLORS.grass} intensity={SUN.ambientIntensity} />
      <RideSun mobile={coarse} />
      <directionalLight color={SCENE_COLORS.fillLight} intensity={0.7} position={[40, 35, -60]} />

      <Suspense fallback={null}>
        <Scenery />
        <Ground />
        <River />
        <GrassField />
        <FloraField />
        <RunnerRig />
        <ExplorationScene />
        <Grazers />
        <WingedLife kind="bird" />
        <WingedLife kind="dragonfly" />
        <ReadySignal />
      </Suspense>
      <SceneEffects enabled={!coarse && dpr > dprRange.min} pixels={RENDER_PIXELS[quality]} />
    </Canvas>
  );
}
