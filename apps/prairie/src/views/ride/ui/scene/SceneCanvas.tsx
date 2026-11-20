'use client';

import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { PCFShadowMap } from 'three';
import { CAMERA, SCENE_COLORS, SUN } from '../../config/scene';
import { FILL_LIGHT_INTENSITY, FILL_LIGHT_POSITION, PERFORMANCE_FLIPFLOPS } from '../../lib/scene/sceneCanvas';
import { useSceneQuality } from '../../model/hooks/useSceneQuality';
import { SceneQualityContext } from '../../model/ride-state/sceneQuality';
import { ExplorationScene } from '../exploration/ExplorationScene';
import { FloraField } from '../flora/FloraField';
import { GrassField } from '../grass/GrassField';
import { River } from '../river/River';
import { RunnerRig } from '../runner-control/RunnerRig';
import { Ground } from '../scenery/Ground';
import { Scenery } from '../scenery/Scenery';
import { Grazers } from '../wildlife/Grazers';
import { WingedLife } from '../wildlife/WingedLife';
import { ReadySignal } from './ReadySignal';
import { RenderBudget } from './RenderBudget';
import { RideSun } from './RideSun';
import { SceneEffects } from './SceneEffects';
import { SceneFailure } from './SceneFailure';

export function SceneCanvas() {
  const {
    lowDetail,
    isSoftware,
    fog,
    desiredDpr,
    pixelBudget,
    hasEffects,
    handleCreated,
    handleDecline,
    handleIncline,
    handleFallback,
  } = useSceneQuality();

  return (
    <Canvas
      className="cursor-grab"
      fallback={<SceneFailure />}
      dpr={desiredDpr}
      shadows={{ type: PCFShadowMap }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
        position: [0, CAMERA.followHeight, -CAMERA.followDistance],
      }}
      onCreated={handleCreated}
    >
      <SceneQualityContext value={lowDetail}>
        <RenderBudget desired={desiredDpr} pixels={pixelBudget} />
        <PerformanceMonitor
          flipflops={PERFORMANCE_FLIPFLOPS}
          onDecline={handleDecline}
          onIncline={handleIncline}
          onFallback={handleFallback}
        />
        <fog attach="fog" args={[SCENE_COLORS.fog, fog.near, fog.far]} />

        <hemisphereLight
          color={SCENE_COLORS.ambient}
          groundColor={SCENE_COLORS.grass}
          intensity={SUN.ambientIntensity}
        />
        <RideSun mobile={lowDetail} />
        <directionalLight
          color={SCENE_COLORS.fillLight}
          intensity={FILL_LIGHT_INTENSITY}
          position={FILL_LIGHT_POSITION}
        />

        <Suspense fallback={null}>
          <Scenery />
          <Ground />
          <River />
          <GrassField isSoftware={isSoftware} />
          <FloraField />
          <RunnerRig />
          <ExplorationScene />
          <Grazers />
          <WingedLife kind="bird" />
          <WingedLife kind="dragonfly" />
          <ReadySignal />
        </Suspense>
        <SceneEffects enabled={hasEffects} pixels={pixelBudget} />
      </SceneQualityContext>
    </Canvas>
  );
}
