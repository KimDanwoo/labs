'use client';
import { terrainHeightAt } from '@shared/config';
import { LANDMARKS } from '@shared/exploration/world';

import { Branch } from './Branch';
import { GardenColumn } from './GardenColumn';
import { GardenPlanting } from './GardenPlanting';

export function FlowerGarden() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4,
          x = Math.cos(a) * 11,
          z = Math.sin(a) * 11,
          height = 2.5 + (i % 3);
        return (
          <group
            key={i}
            position={[
              x,
              terrainHeightAt(LANDMARKS[1].x + x, LANDMARKS[1].z + z) - terrainHeightAt(LANDMARKS[1].x, LANDMARKS[1].z),
              z,
            ]}
            rotation={[0, a, i % 2 ? 0.08 : -0.04]}
          >
            <GardenColumn height={height} />
            <Branch
              radius={0.055}
              color="#577250"
              points={Array.from({ length: 14 }, (_, j) => [
                Math.cos(j * 0.65) * 0.95,
                (j * height) / 14,
                Math.sin(j * 0.65) * 0.95,
              ])}
            />
          </group>
        );
      })}
      <GardenPlanting />
    </>
  );
}
