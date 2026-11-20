'use client';

import { runnerState } from '../../model/ride-state/runnerState';
import { useLowDetail } from '../../model/ride-state/sceneQuality';

import { useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from '@shared/lib/useReducedMotion';
import { CINEMATIC, SCENE_COLORS } from '../../config/scene';

import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, ShaderMaterial, Vector2 } from 'three';
import { FRAGMENT, makeMoteGeometry, VERTEX } from '../../lib/scenery/meadowMotes';
import { useDispose } from '../../model/hooks/useDispose';

export function MeadowMotes() {
  const materialRef = useRef<ShaderMaterial>(null);
  const coarse = useLowDetail();
  const reduced = useReducedMotion();
  const dpr = useThree((state) => state.viewport.dpr);
  const count = coarse ? CINEMATIC.dust.mobile : CINEMATIC.dust.desktop;
  const geometry = useMemo(() => makeMoteGeometry(count), [count]);
  useDispose(geometry);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDpr: { value: 1 },
      uCenter: { value: new Vector2() },
      uColor: { value: new Color(SCENE_COLORS.dust) },
    }),
    [],
  );
  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime!.value = reduced ? 0 : clock.elapsedTime;
    material.uniforms.uDpr!.value = dpr;
    material.uniforms.uCenter!.value.set(runnerState.position.x, runnerState.position.z);
  });
  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
