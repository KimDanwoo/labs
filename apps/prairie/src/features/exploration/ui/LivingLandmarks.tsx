'use client';
import { WingedLife } from '@entities/wildlife';
import { terrainHeightAt } from '@shared/config';
import { LANDMARKS } from '@shared/exploration/world';
import { memo } from 'react';

import { ElderTree } from './ElderTree';
import { FlowerGarden } from './FlowerGarden';
import { SunsetArch } from './SunsetArch';

export const LivingLandmarks = memo(function LivingLandmarks() {
  const tree = LANDMARKS[0],
    garden = LANDMARKS[1];
  return (
    <group>
      {LANDMARKS.map((place, index) => (
        <group key={place.id} position={[place.x, terrainHeightAt(place.x, place.z), place.z]}>
          {index === 0 && <ElderTree />}
          {index === 1 && <FlowerGarden />}
          {index === 2 && <SunsetArch />}
        </group>
      ))}
      <WingedLife kind="bird" anchor={[tree.x, terrainHeightAt(tree.x, tree.z) + 19, tree.z]} />
      <WingedLife kind="butterfly" anchor={[garden.x, terrainHeightAt(garden.x, garden.z), garden.z]} />
    </group>
  );
});

LivingLandmarks.displayName = 'LivingLandmarks';
