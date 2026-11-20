import type { RootState } from '@react-three/fiber';
import { RENDER_PIXELS } from '@shared/lib/renderBudget';
import { useIsCoarsePointer } from '@shared/lib/useCoarsePointer';
import { useState } from 'react';
import { CINEMATIC, FOG, type FogQuality } from '../../config/scene';
import { CANVAS_LABEL, DPR, isSoftwareRenderer, SOFTWARE_DPR_MAX } from '../../lib/scene/sceneCanvas';

// 프레임이 떨어지면 해상도와 장면 품질을 낮추고, 여유가 생기면 되돌린다(적응형 DPR). 소프트웨어 렌더러는 계속 낮춘다.
export function useSceneQuality() {
  const coarse = useIsCoarsePointer();
  const [degraded, setDegraded] = useState(false);
  const [isSoftware, setIsSoftware] = useState(false);
  const lowDetail = coarse || degraded;
  const quality: FogQuality = lowDetail ? 'mobile' : 'desktop';
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
    lowDetail,
    isSoftware,
    fog: FOG[quality],
    desiredDpr: Math.min(dpr, isSoftware ? SOFTWARE_DPR_MAX : dprRange.max),
    pixelBudget: isSoftware ? RENDER_PIXELS.software : RENDER_PIXELS[quality],
    hasEffects: !lowDetail && dpr > dprRange.min,
    handleCreated,
    handleDecline: lowerQuality,
    handleIncline,
    handleFallback: lowerQuality,
  };
}
