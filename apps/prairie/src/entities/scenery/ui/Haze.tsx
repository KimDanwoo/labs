'use client';

import { useFrame } from '@react-three/fiber';
import { coastDistanceAt, HAZE, RIDGES, SCENE_COLORS } from '@shared/config';
import { makeRidgeTexture } from '@shared/lib';
import { useEffect, useMemo, useRef } from 'react';
import { BackSide, Color, MathUtils, Mesh, ShaderMaterial } from 'three';

const HEIGHT = HAZE.topY - HAZE.bottomY;
const CENTER_Y = (HAZE.topY + HAZE.bottomY) / 2;
const glslFloat = (value: number) => value.toFixed(4);
const glslColor = (hex: string) => {
  const { r, g, b } = new Color(hex);
  return `vec3(${glslFloat(r)}, ${glslFloat(g)}, ${glslFloat(b)})`;
};
const RIDGE_GLSL = RIDGES.map(
  (ridge, row) => `
  {
    vec2 profile = texture2D(uRidges, vec2(vUv.x, ${glslFloat((row + 0.5) / RIDGES.length)})).rg;
    float h = ${glslFloat(ridge.baseY)} + ${glslFloat(ridge.ampY)} * profile.r;
    float cover = (1.0 - smoothstep(h - 1.6, h + 1.6, y)) * mountainVisibility;
    float lit = 1.0 + 0.08 * (profile.g * 2.0 - 1.0);
    float face = smoothstep(0.15, 0.95, y / max(h, 1.0));
    float u = vUv.x + ${glslFloat(ridge.seed)};
    float crags = sin(u * 2100.0 + y * 0.06 + sin(u * 440.0) * 3.0) * sin(y * 0.11 - u * 700.0);
    vec3 tint = ${glslColor(ridge.color)} * (lit + face * 0.045 + crags * face * 0.035);
    vec3 ridgeColor = mix(tint, uFog, 0.3 * (1.0 - smoothstep(0.0, 0.35 * h, y)));
    color = mix(color, ridgeColor, cover);
    alpha = max(alpha, cover);
  }
`,
).join('\n');
const VERTEX = `
  varying vec2 vUv;
  varying vec3 vHorizonRay;
  void main() {
    vUv = uv;
    vHorizonRay = (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAGMENT = `
  uniform vec3 uFog;
  uniform float uCoastal;
  uniform sampler2D uRidges;
  varying vec2 vUv;
  varying vec3 vHorizonRay;
  void main() {
    float y = ${glslFloat(HAZE.bottomY)} + vUv.y * ${glslFloat(HEIGHT)};
    vec3 color = uFog;
    float mountainVisibility = 1.0 - uCoastal * smoothstep(-0.3, 0.4, normalize(vHorizonRay).z);
    float alpha = 1.0 - smoothstep(${glslFloat(HAZE.fadeStartY)}, ${glslFloat(HAZE.fadeTopY)}, y);
    ${RIDGE_GLSL}
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const inlandFog = new Color(SCENE_COLORS.fog);
const seaFog = new Color(SCENE_COLORS.oceanHorizon);

export function Haze() {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const ridges = useMemo(() => makeRidgeTexture(RIDGES), []);
  useEffect(() => () => ridges.dispose(), [ridges]);
  const uniforms = useMemo(
    () => ({
      uFog: { value: new Color(SCENE_COLORS.fog) },
      uCoastal: { value: 0 },
      uRidges: { value: ridges },
    }),
    [ridges],
  );
  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    const coastal = MathUtils.smoothstep(coastDistanceAt(camera.position.x, camera.position.z), -300, -20);
    material.uniforms.uCoastal!.value = coastal;
    material.uniforms.uFog!.value.copy(inlandFog).lerp(seaFog, coastal);
    mesh.position.x = camera.position.x;
    mesh.position.z = camera.position.z;
  });
  return (
    <mesh ref={meshRef} position={[0, CENTER_Y, 0]}>
      <cylinderGeometry args={[HAZE.radius, HAZE.radius, HEIGHT, 256, 1, true]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        side={BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
