import type { FishingFrame } from '@views/walk/lib/fishing';
import { createPierFishingParts } from '@views/walk/lib/pierFishingParts';
import { poseFishing } from '@views/walk/lib/poseFishing';
import type * as THREE from 'three';

export function createPierFishing(scene: THREE.Scene) {
  const parts = createPierFishingParts(scene);
  return {
    update(age: number, frame: FishingFrame | null, origin: THREE.Vector3, size: number, reducedMotion: boolean) {
      poseFishing(parts, age, frame, origin, size, reducedMotion);
    },
    dispose: parts.dispose,
  };
}
