'use client';
import { FLOWER_GARDEN } from '@views/ride/config/flowerGarden';
import { gardenColumns } from '@views/ride/lib/exploration/flowerGarden';
import { useMemo } from 'react';

import { Branch } from '@views/ride/ui/exploration/Branch';
import { GardenColumn } from '@views/ride/ui/exploration/GardenColumn';
import { GardenPlanting } from '@views/ride/ui/exploration/GardenPlanting';

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
