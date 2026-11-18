import type { RefObject } from 'react';

import { useParticleStage } from '../../model/hooks/useParticleStage';

interface ParticleCanvasProps {
  slotRef: RefObject<HTMLDivElement | null>;
  onReady: (ready: boolean) => void;
}

export function ParticleCanvas({ slotRef, onReady }: ParticleCanvasProps) {
  const { canvasRef, isDead } = useParticleStage({ slotRef, onReady });

  return (
    <canvas ref={canvasRef} aria-hidden hidden={isDead} className="pointer-events-none fixed inset-0 -z-10 size-full" />
  );
}
