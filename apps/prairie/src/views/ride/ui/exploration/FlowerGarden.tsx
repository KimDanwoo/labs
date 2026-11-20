'use client';
import { useMemo } from 'react';
import { FLOWER_GARDEN } from '../../config/flowerGarden';
import { gardenColumns } from '../../lib/exploration/flowerGarden';

import { Branch } from './Branch';
import { GardenColumn } from './GardenColumn';
import { GardenPlanting } from './GardenPlanting';

export function FlowerGarden() {
  const columns = useMemo(() => gardenColumns(), []);
  return (
    <>
      {columns.map((column) => (
        <group key={column.key} position={column.position} rotation={column.rotation}>
          <GardenColumn height={column.height} />
          <Branch radius={FLOWER_GARDEN.vineRadius} color={FLOWER_GARDEN.vineColor} points={column.vine} />
        </group>
      ))}
      <GardenPlanting />
    </>
  );
}
