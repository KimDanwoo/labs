'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useSceneEffects } from '../../model/hooks/useSceneEffects';

interface SceneEffectsProps {
  enabled: boolean;
  pixels: number;
}

export function SceneEffects({ enabled, pixels }: SceneEffectsProps) {
  const { gl, scene, camera } = useThree();
  const composer = useSceneEffects(enabled, pixels);
  useFrame((_, delta) => {
    if (composer.current) composer.current.render(delta);
    else gl.render(scene, camera);
  }, 1);
  return null;
}
