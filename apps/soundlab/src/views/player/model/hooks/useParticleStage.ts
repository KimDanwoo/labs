import { useAtomValue } from 'jotai';
import type { RefObject } from 'react';

import { currentIndexAtom } from '@views/player/model/store/playback';

import { useArtworkSwap } from '@views/player/model/hooks/useArtworkSwap';
import { useStageFrame } from '@views/player/model/hooks/useStageFrame';
import { useStageRenderer } from '@views/player/model/hooks/useStageRenderer';
import { VISUAL_MODE, visualModeAtom } from '@views/player/model/visual';

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
