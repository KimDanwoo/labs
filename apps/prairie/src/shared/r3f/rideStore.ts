import type { RiverBearing } from '@shared/config';
import { useSyncExternalStore } from 'react';

// Canvas(useFrame) 안의 주행 루프가 쓰고, DOM HUD가 읽는다.
// r3f는 별도 React 루트를 쓰므로 컨텍스트 대신 모듈 레벨 외부 스토어로 양쪽을 잇는다.
type RideSnapshot = {
  riverDistance: number;
  riverBearing: RiverBearing;
};

const INITIAL_SNAPSHOT: RideSnapshot = { riverDistance: 0, riverBearing: 'ahead' };

let snapshot: RideSnapshot = INITIAL_SNAPSHOT;
const listeners = new Set<() => void>();

export function setRideRiver(distance: number, bearing: RiverBearing): void {
  const rounded = Math.round(distance);
  if (rounded === snapshot.riverDistance && bearing === snapshot.riverBearing) return;
  snapshot = { riverDistance: rounded, riverBearing: bearing };
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
