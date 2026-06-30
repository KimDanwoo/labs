import { useSyncExternalStore } from 'react';

// Canvas(useFrame) 안의 주행 루프가 속도를 쓰고, DOM HUD가 읽는다.
// r3f는 별도 React 루트를 쓰므로 컨텍스트 대신 모듈 레벨 외부 스토어로 양쪽을 잇는다.
type RideSnapshot = {
  speedKmh: number;
};

let snapshot: RideSnapshot = { speedKmh: 0 };
const listeners = new Set<() => void>();

export function setRideSpeed(speedKmh: number): void {
  const rounded = Math.round(speedKmh);
  if (rounded === snapshot.speedKmh) return;
  snapshot = { speedKmh: rounded };
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

const SERVER_SNAPSHOT: RideSnapshot = { speedKmh: 0 };

function getServerSnapshot(): RideSnapshot {
  return SERVER_SNAPSHOT;
}

export function useRideSpeed(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).speedKmh;
}
