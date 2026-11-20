'use client';

import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { CAMERA, SCENE_COLORS, SUN } from '@views/ride/config/scene';
import { FILL_LIGHT_INTENSITY, FILL_LIGHT_POSITION, PERFORMANCE_FLIPFLOPS } from '@views/ride/lib/scene/sceneCanvas';
import { useSceneQuality } from '@views/ride/model/hooks/useSceneQuality';
import { SceneQualityContext } from '@views/ride/model/ride-state/sceneQuality';
import { ExplorationScene } from '@views/ride/ui/exploration/ExplorationScene';
import { FloraField } from '@views/ride/ui/flora/FloraField';
import { GrassField } from '@views/ride/ui/grass/GrassField';
import { River } from '@views/ride/ui/river/River';
import { RunnerRig } from '@views/ride/ui/runner-control/RunnerRig';
import { ReadySignal } from '@views/ride/ui/scene/ReadySignal';
import { RenderBudget } from '@views/ride/ui/scene/RenderBudget';
import { RideSun } from '@views/ride/ui/scene/RideSun';
import { SceneEffects } from '@views/ride/ui/scene/SceneEffects';
import { SceneFailure } from '@views/ride/ui/scene/SceneFailure';
import { Ground } from '@views/ride/ui/scenery/Ground';
import { Scenery } from '@views/ride/ui/scenery/Scenery';
import { Grazers } from '@views/ride/ui/wildlife/Grazers';
import { WingedLife } from '@views/ride/ui/wildlife/WingedLife';
import { Suspense } from 'react';
import { PCFShadowMap } from 'three';

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
