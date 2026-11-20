import { useEffect, useRef, useState, type RefObject } from 'react';

import { CLICK_RIPPLE_AMP, REDUCED_MOTION_QUERY, RIPPLE_MS } from '@views/player/config/stage';
import type { Renderer } from '@views/player/lib/stage/renderer';
import { createRendererOrFallback } from '@views/player/lib/stage/rendererFallback';
import { claimRipple } from '@views/player/lib/stage/ripplePool';

export interface StageLayout {
  x: number;
  y: number;
  half: number;
}

interface StageRendererInput {
  slotRef: RefObject<HTMLDivElement | null>;
  onReady: (ready: boolean) => void;
  isCalmMode: boolean;
}

export function useStageRenderer({ slotRef, onReady, isCalmMode }: StageRendererInput) {
  const calmModeRef = useRef(isCalmMode);
  useEffect(() => {
    calmModeRef.current = isCalmMode;
  }, [isCalmMode]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [isDead, setIsDead] = useState(false);
  const layoutRef = useRef<StageLayout>({ x: 0, y: 0, half: 0 });
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const node = canvasRef.current;
    const slot = slotRef.current;
    if (!node) return undefined;
    if (!slot) return undefined;

    const instance = createRendererOrFallback(node);
    if (!instance) {
      setIsDead(true);
      onReady(false);
      return undefined;
    }
    rendererRef.current = instance;
    setIsDead(false);

    const relayout = () => {
      const rect = slotRef.current?.getBoundingClientRect();
      if (!rect) return;
      instance.layout(rect);
      layoutRef.current = {
        x: rect.left + rect.width / 2 - node.clientWidth / 2,
        y: node.clientHeight / 2 - (rect.top + rect.height / 2),
        half: rect.width / 2,
      };
    };
    relayout();
    onReady(true);
    const observer = new ResizeObserver(relayout);
    observer.observe(slot);
    if (slot.parentElement) observer.observe(slot.parentElement);
    window.addEventListener('resize', relayout);

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    reducedMotionRef.current = reducedMotion.matches;
    const readReducedMotion = () => {
      reducedMotionRef.current = reducedMotion.matches;
    };
    reducedMotion.addEventListener('change', readReducedMotion);
    const handlePointerDown = (event: PointerEvent) => {
      if (reducedMotion.matches) return;
      if (calmModeRef.current) return;
      claimRipple(
        event.clientX - node.clientWidth / 2,
        node.clientHeight / 2 - event.clientY,
        CLICK_RIPPLE_AMP,
        RIPPLE_MS,
        true,
      );
    };
    slot.addEventListener('pointerdown', handlePointerDown);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', readReducedMotion);
      slot.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', relayout);
      rendererRef.current = null;
      instance.dispose();
    };
  }, [onReady, slotRef]);

  return { canvasRef, rendererRef, layoutRef, reducedMotionRef, isDead };
}
