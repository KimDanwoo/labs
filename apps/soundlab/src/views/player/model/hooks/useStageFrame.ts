import { useRef, type RefObject } from 'react';

import { frameState } from '@entities/track';
import { useFrame } from '@shared/lib/frame';

import { BEAT_RIPPLE, DECAY, FRAME, MORPH, TRAIL } from '../../config/stage';
import type { Renderer } from '../../lib/stage/renderer';
import { advanceRipples, claimRipple, rippleBuffer, seedBuffer } from '../../lib/stage/ripplePool';
import type { useArtworkSwap } from './useArtworkSwap';
import type { StageLayout } from './useStageRenderer';

interface StageFrameInput {
  rendererRef: RefObject<Renderer | null>;
  layoutRef: RefObject<StageLayout>;
  reducedMotionRef: RefObject<boolean>;
  isCalmMode: boolean;
  artwork: ReturnType<typeof useArtworkSwap>;
}

export function useStageFrame({ rendererRef, layoutRef, reducedMotionRef, isCalmMode, artwork }: StageFrameInput) {
  const morph = useRef<number>(MORPH.initial);
  const prevMorph = useRef(0);
  const trail = useRef(0);
  const seenBeat = useRef(0);

  useFrame((delta) => {
    const instance = rendererRef.current;
    if (!instance || document.hidden) return;
    const step = Math.min(FRAME.maxStep, delta / FRAME.referenceMs);
    const shouldReduceMotion = reducedMotionRef.current || isCalmMode;

    const target = artwork.readWant();
    if (shouldReduceMotion) morph.current = target;
    morph.current += (target - morph.current) * (target > morph.current ? MORPH.inRate : MORPH.outRate) * step;

    if (target === 0 && morph.current < MORPH.swapThreshold) {
      const image = artwork.takeReadyArtwork();
      if (image) instance.setArtwork(image);
    }

    const speed = Math.abs(morph.current - prevMorph.current) / Math.max(FRAME.minSpeedStep, step);
    prevMorph.current = morph.current;
    trail.current += (Math.min(1, speed * TRAIL.speedGain) - trail.current) * TRAIL.ease * step;

    if (frameState.beatId !== seenBeat.current) {
      seenBeat.current = frameState.beatId;
      if (!shouldReduceMotion) {
        const { x, y, half } = layoutRef.current;
        const reach = half * BEAT_RIPPLE.spread;
        claimRipple(
          x + (Math.random() * 2 - 1) * reach,
          y + (Math.random() * 2 - 1) * reach,
          frameState.beatStrength * BEAT_RIPPLE.amp,
          BEAT_RIPPLE.ms,
          false,
        );
      }
    }

    const energy = advanceRipples(delta);

    instance.render({
      morph: morph.current,
      level: shouldReduceMotion ? 0 : frameState.level,
      swell: shouldReduceMotion ? 0 : frameState.swell,
      pre: shouldReduceMotion ? 0 : frameState.pre,
      hit: shouldReduceMotion ? 0 : frameState.hit,
      air: shouldReduceMotion ? 0 : frameState.air,
      decay: Math.min(DECAY.max, trail.current * DECAY.trail + energy * DECAY.energy),
      ripples: rippleBuffer,
      rippleSeeds: seedBuffer,
    });
  });
}
