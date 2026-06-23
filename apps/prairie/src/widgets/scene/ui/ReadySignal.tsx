'use client';

import { useFrame } from '@react-three/fiber';
import { setSceneReady } from '@shared/r3f';
import { useRef } from 'react';

// Suspense가 풀려 씬이 마운트된 뒤 첫 프레임에서 ready 신호를 보낸다.
// 로딩 오버레이는 에셋 로드가 아니라 "실제로 첫 화면이 그려진" 이 시점까지 유지된다.
export function ReadySignal() {
  const fired = useRef(false);

  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    setSceneReady();
  });

  return null;
}
