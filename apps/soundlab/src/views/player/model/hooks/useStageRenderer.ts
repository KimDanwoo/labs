import { useEffect, useRef, useState, type RefObject } from 'react';

import { CLICK_RIPPLE_AMP, REDUCED_MOTION_QUERY, RIPPLE_MS } from '../../config/stage';
import type { Renderer } from '../../lib/stage/renderer';
import { createRendererOrFallback } from '../../lib/stage/rendererFallback';
import { claimRipple } from '../../lib/stage/ripplePool';

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
  // 렌더러가 안 서면 캔버스를 화면에서 뺀다. alpha:false로 만든 컨텍스트라 한 번도 안 그린 캔버스가
  // 투명이 아니라 불투명으로 합성되는데, 이 캔버스는 뷰포트 전체를 덮으므로 body 배경이 통째로 가려진다.
  const [isDead, setIsDead] = useState(false);
  const layoutRef = useRef<StageLayout>({ x: 0, y: 0, half: 0 });
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const node = canvasRef.current;
    const slot = slotRef.current;
    if (!node || !slot) return undefined;

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
    // 슬롯은 크기가 그대로인 채 위치만 바뀔 수 있다(재생목록 접기 → 무대 열이 넓어짐).
    // ResizeObserver는 위치 변화로는 안 울리므로, 크기가 실제로 변하는 무대 영역도 함께 본다.
    if (slot.parentElement) observer.observe(slot.parentElement);
    window.addEventListener('resize', relayout);

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    reducedMotionRef.current = reducedMotion.matches;
    const readReducedMotion = () => {
      reducedMotionRef.current = reducedMotion.matches;
    };
    reducedMotion.addEventListener('change', readReducedMotion);
    const handlePointerDown = (event: PointerEvent) => {
      if (reducedMotion.matches || calmModeRef.current) return;
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
