'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BackSide, Color, MathUtils, Mesh, ShaderMaterial } from 'three';
import { coastDistanceAt, HAZE, RIDGES, SCENE_COLORS } from '../../config/scene';
import { makeRidgeTexture } from '../../lib/makeRidgeTexture';
import { CENTER_Y, FRAGMENT, HEIGHT, inlandFog, seaFog, VERTEX } from '../../lib/scenery/haze';

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
