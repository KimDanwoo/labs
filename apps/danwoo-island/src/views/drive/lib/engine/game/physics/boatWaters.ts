import { PONDS } from '@views/drive/lib/engine/game/world/layout/islandLayout';

import { tideWeight } from '@views/drive/lib/engine/game/world/layout/tideCove';

export const BOAT_SEABED = { enter: -1.3, leave: -1 } as const;
export const BOAT_DECK = { enter: 0.7, leave: 0.9 } as const;
const POND_REACH = { shoreRatio: 1.15, padding: 2 } as const;

export interface BoatWaterProbe {
  readonly isBoating: boolean;
  readonly isFlying: boolean;
  readonly x: number;
  readonly z: number;
  readonly elevation: number;
  readonly seabed: number | null;
}

export function isInPond(x: number, z: number): boolean {
  return PONDS.some(
    ({ center, radius }) =>
      Math.hypot(x - center[0], z - center[1]) < radius * POND_REACH.shoreRatio + POND_REACH.padding,
  );
}

export function shouldBoat({ isBoating, isFlying, x, z, elevation, seabed }: BoatWaterProbe): boolean {
  if (isFlying) return false;
  if (isInPond(x, z)) return false;
  if (elevation > (isBoating ? BOAT_DECK.leave : BOAT_DECK.enter)) return false;
  if (seabed === null) return true;
  if (tideWeight(x, z) === 1) return seabed < (isBoating ? -0.52 : -0.68);
  return seabed < (isBoating ? BOAT_SEABED.leave : BOAT_SEABED.enter);
}
