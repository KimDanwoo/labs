'use client';

import { useFrame } from '@react-three/fiber';
import { HAZE_VIEW } from '@views/ride/config/hazeView';
import { HAZE, RIDGES, SCENE_COLORS } from '@views/ride/config/scene';
import { makeRidgeTexture } from '@views/ride/lib/makeRidgeTexture';
import { CENTER_Y, FRAGMENT, HEIGHT, updateHaze, VERTEX } from '@views/ride/lib/scenery/haze';
import { useDispose } from '@views/ride/model/hooks/useDispose';
import { useMemo, useRef } from 'react';
import { BackSide, Color, Mesh, ShaderMaterial } from 'three';

export function Haze() {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const ridges = useMemo(() => makeRidgeTexture(RIDGES), []);
  useDispose(ridges);
  const uniforms = useMemo(
    () => ({
      uFog: { value: new Color(SCENE_COLORS.fog) },
      uCoastal: { value: 0 },
      uRidges: { value: ridges },
    }),
    [ridges],
  );
  useFrame(({ camera }) => {
    if (!meshRef.current) return;
    if (!materialRef.current) return;
    updateHaze(meshRef.current, materialRef.current, camera);
  });
  return (
    <mesh ref={meshRef} position={[0, CENTER_Y, 0]}>
      <cylinderGeometry
        args={[
          HAZE.radius,
          HAZE.radius,
          HEIGHT,
          HAZE_VIEW.radialSegments,
          HAZE_VIEW.heightSegments,
          HAZE_VIEW.openEnded,
        ]}
      />
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
