import type { RiverBearing } from '@views/ride/lib/scene/terrain';
import { useSyncExternalStore } from 'react';

type RideSnapshot = {
  riverDistance: number;
  riverBearing: RiverBearing;
  seaDistance: number;
  atSea: boolean;
};

const INITIAL_SNAPSHOT: RideSnapshot = { riverDistance: 0, riverBearing: 'ahead', seaDistance: 900, atSea: false };

let snapshot: RideSnapshot = INITIAL_SNAPSHOT;
const listeners = new Set<() => void>();

export function setRideRiver(distance: number, bearing: RiverBearing, coastDistance: number): void {
  const rounded = Math.round(distance);
  const seaDistance = Math.max(0, Math.round(-coastDistance / 10) * 10);
  const atSea = coastDistance >= 0;
  const isUnchanged =
    rounded === snapshot.riverDistance &&
    bearing === snapshot.riverBearing &&
    seaDistance === snapshot.seaDistance &&
    atSea === snapshot.atSea;
  if (isUnchanged) return;
  snapshot = { riverDistance: rounded, riverBearing: bearing, seaDistance, atSea };
  listeners.forEach((listen) => listen());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): RideSnapshot {
  return snapshot;
}

function getServerSnapshot(): RideSnapshot {
  return INITIAL_SNAPSHOT;
}

export function useRideRiver(): RideSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
