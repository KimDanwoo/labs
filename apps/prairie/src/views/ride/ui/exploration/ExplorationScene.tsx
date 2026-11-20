'use client';

import { useFrame } from '@react-three/fiber';
import { centers } from '@views/ride/lib/exploration/explorationScene';
import { createExplorationTracker, stepExploration } from '@views/ride/model/exploration/explorationStep';
import { useExploration } from '@views/ride/model/exploration/store';
import { useExplorationLoad } from '@views/ride/model/exploration/useExplorationLoad';
import { LivingLandmarks } from '@views/ride/ui/exploration/LivingLandmarks';
import { StarlightGate } from '@views/ride/ui/exploration/StarlightGate';
import { useRef } from 'react';

export function ExplorationScene() {
  const progress = useExploration();
  const tracker = useRef(createExplorationTracker());
  useExplorationLoad();
  useFrame((state, delta) => {
    stepExploration(tracker.current, state.clock.elapsedTime, delta);
  });
  return (
    <group>
      <LivingLandmarks />
      {centers.map(
        (center, index) =>
          index >= progress.nextGate && (
            <group key={index} position={[center.x, center.y, center.z]}>
              <StarlightGate active={index === progress.nextGate} index={index} />
            </group>
          ),
      )}
    </group>
  );
}
