'use client';

import { useThree } from '@react-three/fiber';
import { useIsCoarsePointer } from '@shared/lib/useCoarsePointer';
import { VIEW_LOOK } from '@views/ride/model/runner-control/constants';
import { useEffect } from 'react';
import { MathUtils } from 'three';

export function usePointerLook(yawRef: { current: number }, pitchRef: { current: number }): void {
  const domElement = useThree((state) => state.gl.domElement);
  const coarse = useIsCoarsePointer();

  useEffect(() => {
    if (coarse) return undefined;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      domElement.setPointerCapture(event.pointerId);
    };
    const handleMove = (event: PointerEvent) => {
      if (!dragging) return;
      yawRef.current += (event.clientX - lastX) * VIEW_LOOK.sensitivity;
      pitchRef.current = MathUtils.clamp(
        pitchRef.current + (event.clientY - lastY) * VIEW_LOOK.pitchSensitivity,
        VIEW_LOOK.minPitch,
        VIEW_LOOK.maxPitch,
      );
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const stop = () => {
      dragging = false;
    };

    domElement.addEventListener('pointerdown', handleDown);
    domElement.addEventListener('pointermove', handleMove);
    domElement.addEventListener('pointerup', stop);
    domElement.addEventListener('pointercancel', stop);
    domElement.addEventListener('lostpointercapture', stop);
    window.addEventListener('blur', stop);

    return () => {
      domElement.removeEventListener('pointerdown', handleDown);
      domElement.removeEventListener('pointermove', handleMove);
      domElement.removeEventListener('pointerup', stop);
      domElement.removeEventListener('pointercancel', stop);
      domElement.removeEventListener('lostpointercapture', stop);
      window.removeEventListener('blur', stop);
    };
  }, [domElement, coarse, yawRef, pitchRef]);
}
