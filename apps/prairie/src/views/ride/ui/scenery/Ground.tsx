'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { SCENE_COLORS, WORLD } from '@views/ride/config/scene';
import { GRID_STEP, groundTime, shadeGround, SHADOW_LAYER_LIFT, SHADOW_OPACITY } from '@views/ride/lib/scenery/ground';
import { useRef } from 'react';
import { Group } from 'three';

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
