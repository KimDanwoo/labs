'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { SCENE_COLORS, WORLD } from '@shared/config';
import { ToonMaterial } from '@shared/r3f';
import { useRef } from 'react';
import { Mesh } from 'three';

// 바닥 평면이 카메라 XZ를 따라다녀 가장자리에 닿지 않는다 → 무한 들판.
export function Ground() {
  const meshRef = useRef<Mesh>(null);
  const camera = useThree((state) => state.camera);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.x = camera.position.x;
    mesh.position.z = camera.position.z;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[WORLD.groundSize, WORLD.groundSize]} />
      <ToonMaterial color={SCENE_COLORS.grass} />
    </mesh>
  );
}
