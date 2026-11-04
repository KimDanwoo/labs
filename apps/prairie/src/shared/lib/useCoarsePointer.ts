'use client';

import { useSyncExternalStore } from 'react';

const COARSE_QUERY = '(pointer: coarse)';

// 터치(굵은 포인터) 기기 여부. 캔버스 dpr·그래스 품질 조정과 터치 컨트롤 노출에 쓴다.
// SSR은 false로 고정하고 클라이언트에서는 실제 미디어 쿼리를 구독한다.
function subscribe(listener: () => void) {
  const media = window.matchMedia(COARSE_QUERY);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
const getSnapshot = () => window.matchMedia(COARSE_QUERY).matches;
const getServerSnapshot = () => false;

export function useIsCoarsePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
