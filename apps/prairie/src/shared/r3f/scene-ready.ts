import { useSyncExternalStore } from 'react';

// Canvas(useFrame) 안에서 첫 프레임이 그려지면 true. DOM 로딩 오버레이가 이 신호까지 유지된다.
// r3f는 별도 React 루트라 컨텍스트 대신 모듈 레벨 외부 스토어로 양쪽을 잇는다.
let ready = false;
const listeners = new Set<() => void>();

export function setSceneReady(): void {
  if (ready) return;
  ready = true;
  listeners.forEach((listen) => listen());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return ready;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useSceneReady(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
