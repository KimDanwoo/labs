import { useAtomValue } from 'jotai';
import type { RefObject } from 'react';

import { currentIndexAtom } from '@entities/track';

import { VISUAL_MODE, visualModeAtom } from '../visual';
import { useArtworkSwap } from './useArtworkSwap';
import { useStageFrame } from './useStageFrame';
import { useStageRenderer } from './useStageRenderer';

interface ParticleStageInput {
  slotRef: RefObject<HTMLDivElement | null>;
  onReady: (ready: boolean) => void;
}

export function useParticleStage({ slotRef, onReady }: ParticleStageInput) {
  const index = useAtomValue(currentIndexAtom);
  const isCalmMode = useAtomValue(visualModeAtom) === VISUAL_MODE.calm;

  const { canvasRef, rendererRef, layoutRef, reducedMotionRef, isDead } = useStageRenderer({
    slotRef,
    onReady,
    isCalmMode,
  });
  const artwork = useArtworkSwap(index);
  useStageFrame({ rendererRef, layoutRef, reducedMotionRef, isCalmMode, artwork });

  return { canvasRef, isDead };
}
