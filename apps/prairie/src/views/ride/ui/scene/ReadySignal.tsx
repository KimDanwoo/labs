'use client';

import { useFrame } from '@react-three/fiber';
import { setSceneReady } from '@views/ride/model/ride-state/sceneReady';
import { useRef } from 'react';

export function ReadySignal() {
  const fired = useRef(false);

  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    setSceneReady();
  });

  return null;
}
