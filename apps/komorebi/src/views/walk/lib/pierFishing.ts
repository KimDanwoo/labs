import type * as THREE from 'three';
import type { FishingFrame } from './fishing';
import { createPierFishingParts } from './pierFishingParts';
import { poseFishing } from './poseFishing';

export function createPierFishing(scene: THREE.Scene) {
  const parts = createPierFishingParts(scene);
  return {
    update(age: number, frame: FishingFrame | null, origin: THREE.Vector3, size: number, reducedMotion: boolean) {
      poseFishing(parts, age, frame, origin, size, reducedMotion);
    },
    dispose: parts.dispose,
  };
}
