'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Group } from 'three';
import { SCENE_COLORS, WORLD } from '../../config/scene';
import { GRID_STEP, groundTime, shadeGround, SHADOW_LAYER_LIFT, SHADOW_OPACITY } from '../../lib/scenery/ground';

// 바닥 평면이 카메라 XZ를 따라다녀 가장자리에 닿지 않는다 → 무한 들판.
// 정점 간격으로 스냅해야 정점이 항상 같은 월드 지점의 높이를 샘플링한다(안 하면 기복이 카메라를 따라 꿈틀댄다).
export function Ground() {
  const meshRef = useRef<Group>(null);
  const camera = useThree((state) => state.camera);

  useFrame(({ clock }) => {
    groundTime.value = clock.elapsedTime;
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.x = Math.round(camera.position.x / GRID_STEP) * GRID_STEP;
    mesh.position.z = Math.round(camera.position.z / GRID_STEP) * GRID_STEP;
  });

  return (
    <group ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <planeGeometry args={[WORLD.groundSize, WORLD.groundSize, WORLD.groundSegments, WORLD.groundSegments]} />
        <meshBasicMaterial color={SCENE_COLORS.grass} onBeforeCompile={shadeGround} />
      </mesh>
      <mesh receiveShadow position={[0, 0, SHADOW_LAYER_LIFT]}>
        <planeGeometry args={[WORLD.groundSize, WORLD.groundSize, WORLD.groundSegments, WORLD.groundSegments]} />
        <shadowMaterial transparent opacity={SHADOW_OPACITY} depthWrite={false} onBeforeCompile={shadeGround} />
      </mesh>
    </group>
  );
}
