'use client';

import { runnerState } from '../../model/ride-state/runnerState';
import { useLowDetail } from '../../model/ride-state/sceneQuality';

import { useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from '@shared/lib/useReducedMotion';
import { CINEMATIC, SCENE_COLORS } from '../../config/scene';

import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial, Vector2 } from 'three';
import { FRAGMENT, VERTEX } from '../../lib/scenery/meadowMotes';

export function MeadowMotes() {
  const materialRef = useRef<ShaderMaterial>(null);
  const coarse = useLowDetail();
  const reduced = useReducedMotion();
  const dpr = useThree((state) => state.viewport.dpr);
  const count = coarse ? CINEMATIC.dust.mobile : CINEMATIC.dust.desktop;
  const geometry = useMemo(() => {
    const data = new BufferGeometry();
    const positions: number[] = [];
    const seeds: number[] = [];
    const hash = (i: number) => {
      const value = Math.sin(i * 127.1 + 3.7) * 43758.5453;
      return value - Math.floor(value);
    };
    for (let i = 0; i < count; i++) {
      positions.push((hash(i) - 0.5) * 80, 0.4 + hash(i + 300) * CINEMATIC.dust.height, (hash(i + 600) - 0.5) * 80);
      seeds.push(hash(i + 900));
    }
    data.setAttribute('position', new Float32BufferAttribute(positions, 3));
    data.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
    return data;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
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
