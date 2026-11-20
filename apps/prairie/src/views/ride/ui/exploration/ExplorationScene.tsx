'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { centers } from '../../lib/exploration/explorationScene';
import { createExplorationTracker, stepExploration } from '../../model/exploration/explorationStep';
import { useExploration } from '../../model/exploration/store';
import { useExplorationLoad } from '../../model/exploration/useExplorationLoad';
import { LivingLandmarks } from './LivingLandmarks';
import { StarlightGate } from './StarlightGate';

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
