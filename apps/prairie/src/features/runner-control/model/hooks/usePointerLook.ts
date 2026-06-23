'use client';

import { useThree } from '@react-three/fiber';
import { useIsCoarsePointer } from '@shared/lib';
import { useEffect } from 'react';
import { VIEW_LOOK } from '../constants';

// PC(마우스)에서 캔버스를 좌우로 끌어 카메라 yaw 오프셋을 누적한다. 터치 기기에선 비활성(조이스틱이 대신).
// 카메라 배치 로직(useFrame)이 매 프레임 yawRef를 읽으므로 리렌더는 일으키지 않는다.
export function usePointerLook(yawRef: { current: number }): void {
  const domElement = useThree((state) => state.gl.domElement);
  const coarse = useIsCoarsePointer();

  useEffect(() => {
    if (coarse) return undefined;

    let dragging = false;
    let lastX = 0;

    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      lastX = event.clientX;
      domElement.setPointerCapture(event.pointerId);
    };
    const handleMove = (event: PointerEvent) => {
      if (!dragging) return;
      yawRef.current += (event.clientX - lastX) * VIEW_LOOK.sensitivity;
      lastX = event.clientX;
    };
    const stop = () => {
      dragging = false;
    };

    domElement.addEventListener('pointerdown', handleDown);
    domElement.addEventListener('pointermove', handleMove);
    domElement.addEventListener('pointerup', stop);
    domElement.addEventListener('pointercancel', stop);

    return () => {
      domElement.removeEventListener('pointerdown', handleDown);
      domElement.removeEventListener('pointermove', handleMove);
      domElement.removeEventListener('pointerup', stop);
      domElement.removeEventListener('pointercancel', stop);
    };
  }, [domElement, coarse, yawRef]);
}
