'use client';

import { useEffect, useState } from 'react';

const COARSE_QUERY = '(pointer: coarse)';

// 터치(굵은 포인터) 기기 여부. 캔버스 dpr·그래스 품질 조정과 터치 컨트롤 노출에 쓴다.
// SSR/첫 렌더는 false → 마운트 후 실제 값으로 갱신(하이드레이션 안전).
export function useIsCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(COARSE_QUERY);
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return coarse;
}
