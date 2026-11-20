import type { RootState } from '@react-three/fiber';
import { RENDER_PIXELS } from '@shared/lib/renderBudget';
import { useIsCoarsePointer } from '@shared/lib/useCoarsePointer';
import { CINEMATIC, FOG, type FogQuality } from '@views/ride/config/scene';
import { CANVAS_LABEL, DPR, isSoftwareRenderer, SOFTWARE_DPR_MAX } from '@views/ride/lib/scene/sceneCanvas';
import { useState } from 'react';

export function useSceneQuality() {
  const coarse = useIsCoarsePointer();
  const [degraded, setDegraded] = useState(false);
  const [isSoftware, setIsSoftware] = useState(false);
  const isLowDetail = coarse || degraded;
  const quality: FogQuality = isLowDetail ? 'mobile' : 'desktop';
  const dprRange = DPR[quality];
  const [dpr, setDpr] = useState<number>(dprRange.max);

  const lowerQuality = () => {
    setDpr(DPR.mobile.min);
    setDegraded(true);
  };

  const handleCreated = ({ gl }: RootState) => {
    if (isSoftwareRenderer(gl.getContext())) {
      setIsSoftware(true);
      lowerQuality();
    }
    gl.toneMappingExposure = CINEMATIC.exposure;
    gl.domElement.setAttribute('aria-label', CANVAS_LABEL);
    gl.domElement.tabIndex = 0;
  };

  const handleIncline = () => {
    if (isSoftware) return;
    setDpr(DPR.desktop.max);
    setDegraded(false);
  };

  return {
    lowDetail: isLowDetail,
    isSoftware,
    fog: FOG[quality],
    desiredDpr: Math.min(dpr, isSoftware ? SOFTWARE_DPR_MAX : dprRange.max),
    pixelBudget: isSoftware ? RENDER_PIXELS.software : RENDER_PIXELS[quality],
    hasEffects: !isLowDetail && dpr > dprRange.min,
    handleCreated,
    handleDecline: lowerQuality,
    handleIncline,
    handleFallback: lowerQuality,
  };
}
