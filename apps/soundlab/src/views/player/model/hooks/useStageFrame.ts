import { useRef, type RefObject } from 'react';

import { useFrame } from '@shared/lib/frame';
import { frameState } from '@views/player/model/store/playback';

import { BEAT_RIPPLE, DECAY, FRAME, MORPH, TRAIL } from '@views/player/config/stage';
import type { Renderer } from '@views/player/lib/stage/renderer';
import { advanceRipples, claimRipple, rippleBuffer, seedBuffer } from '@views/player/lib/stage/ripplePool';
import type { useArtworkSwap } from '@views/player/model/hooks/useArtworkSwap';
import type { StageLayout } from '@views/player/model/hooks/useStageRenderer';

const STILL_SIGNALS = { level: 0, swell: 0, pre: 0, hit: 0, air: 0 } as const;

interface StageFrameInput {
  rendererRef: RefObject<Renderer | null>;
  layoutRef: RefObject<StageLayout>;
  reducedMotionRef: RefObject<boolean>;
  isCalmMode: boolean;
  artwork: ReturnType<typeof useArtworkSwap>;
}

function spawnBeatRipple(layout: StageLayout): void {
  const { x, y, half } = layout;
  const reach = half * BEAT_RIPPLE.spread;
  claimRipple(
    x + (Math.random() * 2 - 1) * reach,
    y + (Math.random() * 2 - 1) * reach,
    frameState.beatStrength * BEAT_RIPPLE.amp,
    BEAT_RIPPLE.ms,
    false,
  );
}

function swapArtworkWhenHidden(
  instance: Renderer,
  artwork: ReturnType<typeof useArtworkSwap>,
  target: number,
  morph: number,
): void {
  if (target !== 0) return;
  if (morph >= MORPH.swapThreshold) return;
  const image = artwork.takeReadyArtwork();
  if (image) instance.setArtwork(image);
}

export function useStageFrame({ rendererRef, layoutRef, reducedMotionRef, isCalmMode, artwork }: StageFrameInput) {
  const morph = useRef<number>(MORPH.initial);
  const prevMorph = useRef(0);
  const trail = useRef(0);
  const seenBeat = useRef(0);

  useFrame((delta) => {
    const instance = rendererRef.current;
    if (!instance) return;
    if (document.hidden) return;
    const step = Math.min(FRAME.maxStep, delta / FRAME.referenceMs);
    const shouldReduceMotion = reducedMotionRef.current || isCalmMode;

    const target = artwork.readWant();
    if (shouldReduceMotion) morph.current = target;
    morph.current += (target - morph.current) * (target > morph.current ? MORPH.inRate : MORPH.outRate) * step;

    swapArtworkWhenHidden(instance, artwork, target, morph.current);

    const speed = Math.abs(morph.current - prevMorph.current) / Math.max(FRAME.minSpeedStep, step);
    prevMorph.current = morph.current;
    trail.current += (Math.min(1, speed * TRAIL.speedGain) - trail.current) * TRAIL.ease * step;

    if (frameState.beatId !== seenBeat.current) {
      seenBeat.current = frameState.beatId;
      if (!shouldReduceMotion) spawnBeatRipple(layoutRef.current);
    }

    const energy = advanceRipples(delta);
    const signals = shouldReduceMotion ? STILL_SIGNALS : frameState;

    instance.render({
      morph: morph.current,
      level: signals.level,
      swell: signals.swell,
      pre: signals.pre,
      hit: signals.hit,
      air: signals.air,
      decay: Math.min(DECAY.max, trail.current * DECAY.trail + energy * DECAY.energy),
      ripples: rippleBuffer,
      rippleSeeds: seedBuffer,
    });
  });
}
