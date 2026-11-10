'use client';

import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { RENDER_PIXELS } from '@shared/lib/renderBudget';
import { useIsCoarsePointer } from '@shared/lib/useCoarsePointer';
import { Suspense, useState } from 'react';
import { PCFShadowMap } from 'three';
import { CAMERA, CINEMATIC, FOG, SCENE_COLORS, SUN, type FogQuality } from '../../config/scene';
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

const DPR = {
  desktop: { max: 1.5, min: 1 },
  mobile: { max: 1.25, min: 0.8 },
} as const;

export function SceneCanvas() {
  const coarse = useIsCoarsePointer();
  const [degraded, setDegraded] = useState(false);
  const [isSoftware, setIsSoftware] = useState(false);
  const lowDetail = coarse || degraded;
  const quality: FogQuality = lowDetail ? 'mobile' : 'desktop';
  const fog = FOG[quality];
  const dprRange = DPR[quality];
  // 프레임이 떨어지면 해상도를 낮추고, 여유가 생기면 되돌린다(적응형 DPR).
  const [dpr, setDpr] = useState<number>(dprRange.max);
  const desiredDpr = Math.min(dpr, isSoftware ? 0.6 : dprRange.max);
  const pixelBudget = isSoftware ? RENDER_PIXELS.software : RENDER_PIXELS[quality];

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
      onCreated={({ gl }) => {
        const context = gl.getContext();
        const info = context.getExtension('WEBGL_debug_renderer_info');
        const renderer: unknown = info ? context.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
        if (typeof renderer === 'string' && /swiftshader|llvmpipe|software/i.test(renderer)) {
          setIsSoftware(true);
          setDegraded(true);
          setDpr(DPR.mobile.min);
        }
        gl.toneMappingExposure = CINEMATIC.exposure;
        gl.domElement.setAttribute('aria-label', '유니콘 Rush 3D 초원. WASD로 이동, Space로 비행, 드래그로 시점 회전');
        gl.domElement.tabIndex = 0;
      }}
    >
      <SceneQualityContext value={lowDetail}>
        <RenderBudget desired={desiredDpr} pixels={pixelBudget} />
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => {
            setDpr(DPR.mobile.min);
            setDegraded(true);
          }}
          onIncline={() => {
            if (!isSoftware) {
              setDpr(DPR.desktop.max);
              setDegraded(false);
            }
          }}
          onFallback={() => {
            setDpr(DPR.mobile.min);
            setDegraded(true);
          }}
        />
        <fog attach="fog" args={[SCENE_COLORS.fog, fog.near, fog.far]} />

        <hemisphereLight
          color={SCENE_COLORS.ambient}
          groundColor={SCENE_COLORS.grass}
          intensity={SUN.ambientIntensity}
        />
        <RideSun mobile={lowDetail} />
        <directionalLight color={SCENE_COLORS.fillLight} intensity={0.7} position={[40, 35, -60]} />

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
        <SceneEffects enabled={!lowDetail && dpr > dprRange.min} pixels={pixelBudget} />
      </SceneQualityContext>
    </Canvas>
  );
}
