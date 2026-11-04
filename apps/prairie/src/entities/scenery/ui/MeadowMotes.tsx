'use client';

import { runnerState, useLowDetail } from '@shared/r3f';

import { useFrame, useThree } from '@react-three/fiber';
import { CINEMATIC, RIVER_GLSL, SCENE_COLORS, TERRAIN_GLSL } from '@shared/config';
import { useReducedMotion } from '@shared/lib';

import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial, Vector2 } from 'three';

const VERTEX = `
  attribute float aSeed;
  uniform float uTime, uDpr;
  uniform vec2 uCenter;
  varying float vAlpha;
  ${RIVER_GLSL}
  ${TERRAIN_GLSL}
  void main() {
    float span = ${(CINEMATIC.dust.radius * 2).toFixed(1)};
    vec3 p = position;
    p.xz = mod(p.xz + vec2(uTime * 0.18, uTime * 0.08) - uCenter + span * 0.5, span) - span * 0.5 + uCenter;
    p.y += terrainHeight(p.xz) + sin(uTime * 0.35 + aSeed * 20.0) * 0.4;
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    float distanceFade = (1.0 - smoothstep(22.0, 40.0, length(p.xz - uCenter))) * smoothstep(1.0, 5.0, -view.z);
    vAlpha = distanceFade * (0.2 + 0.5 * pow(sin(uTime * 0.5 + aSeed * 30.0) * 0.5 + 0.5, 3.0));
    gl_PointSize = clamp((2.0 + aSeed * 2.0) * uDpr * 12.0 / max(-view.z, 1.0), 1.0, 5.0 * uDpr);
    gl_Position = projectionMatrix * view;
  }
`;
const FRAGMENT = `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = (1.0 - smoothstep(0.1, 1.0, radius)) * vAlpha;
    gl_FragColor = vec4(uColor * 1.4, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

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
