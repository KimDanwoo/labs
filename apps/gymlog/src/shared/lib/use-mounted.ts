import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// 서버/첫 페인트엔 false, 마운트 후 true — localStorage 기반 atom의 하이드레이션 불일치 방지.
export const useMounted = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
